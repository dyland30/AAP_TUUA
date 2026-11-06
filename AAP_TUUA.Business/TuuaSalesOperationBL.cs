using System.Globalization;
using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class TuuaSalesOperationBL
{
    private const int MaxSearchDays = 92;
    private const string CurrencyGroupName = "Monedas";
    private const string DocumentTypeGroupName = "Tipos Documentos TUUA";
    private const string SaleTypeGroupName = "Modalidad de Venta TUUA";
    private const string PaymentTypeGroupName = "Tipos de Pago";
    private const string FlightTypeGroupName = "Tipos de Vuelo";
    private const string AccountingParametersGroupName = "Parametros Contables";
    private const string SaleParametersGroupName = "Parametros Venta TUUA";
    private const string NationalCurrencyValue = "PEN";
    private const string MixedFlightTypeValue = "M";
    private static readonly string[] SaleDocumentTypeValues = ["56", "28"];
    private static readonly string[] SalePaymentTypeValues = ["E", "T", "Y", "P"];

    private readonly string _cnx;
    private readonly TuuaSalesOperationDao _tuuaSalesOperationDao;
    private readonly CashierMachineSessionDao _cashierMachineSessionDao;
    private readonly ExchangeRateDao _exchangeRateDao;
    private readonly TuuaPriceDao _tuuaPriceDao;
    private readonly AirlineDao _airlineDao;
    private readonly FlightDao _flightDao;
    private readonly DocumentSequentialNumberDao _documentSequentialNumberDao;
    private readonly TuuaGateDao _tuuaGateDao;
    private readonly FeatureDao _featureDao;
    private readonly CashierMachineDao _cashierMachineDao;
    private readonly TerminalDao _terminalDao;
    private readonly LocationDao _locationDao;
    private readonly AirportDao _airportDao;
    private readonly TuuaSalesOperationValidator _tuuaSalesOperationValidator;
    private readonly TuuaTicketSaleRequestValidator _tuuaTicketSaleRequestValidator;

    public TuuaSalesOperationBL(string cnx)
    {
        _cnx = cnx;
        _tuuaSalesOperationDao = new TuuaSalesOperationDao(cnx);
        _cashierMachineSessionDao = new CashierMachineSessionDao(cnx);
        _exchangeRateDao = new ExchangeRateDao(cnx);
        _tuuaPriceDao = new TuuaPriceDao(cnx);
        _airlineDao = new AirlineDao(cnx);
        _flightDao = new FlightDao(cnx);
        _documentSequentialNumberDao = new DocumentSequentialNumberDao(cnx);
        _tuuaGateDao = new TuuaGateDao(cnx);
        _featureDao = new FeatureDao(cnx);
        _cashierMachineDao = new CashierMachineDao(cnx);
        _terminalDao = new TerminalDao(cnx);
        _locationDao = new LocationDao(cnx);
        _airportDao = new AirportDao(cnx);
        _tuuaSalesOperationValidator = new TuuaSalesOperationValidator();
        _tuuaTicketSaleRequestValidator = new TuuaTicketSaleRequestValidator();
    }

    public async Task<IEnumerable<TuuaSalesOperation>?> GetAll()
    {
        return await _tuuaSalesOperationDao.GetAll();
    }

    public async Task<TuuaSalesOperation?> GetById(Guid id)
    {
        return await _tuuaSalesOperationDao.GetById(id);
    }

    public async Task<IEnumerable<TuuaSalesOperation>?> GetByCashierMachineSessionId(Guid cashierMachineSessionId)
    {
        return await _tuuaSalesOperationDao.GetByCashierMachineSessionId(cashierMachineSessionId);
    }

    public async Task<TuuaSalesOperation> Add(TuuaSalesOperation salesOperation, string? userId)
    {
        var result = await _tuuaSalesOperationValidator.ValidateAsync(salesOperation);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        ValidateTickets(salesOperation);
        await ValidateReferences(salesOperation);

        salesOperation.created_at = DateTime.Now;
        salesOperation.updated_at = DateTime.Now;
        salesOperation.created_by = userId;
        salesOperation.modified_by = userId;

        foreach (var ticket in salesOperation.tickets)
        {
            ticket.created_at = DateTime.Now;
            ticket.updated_at = DateTime.Now;
            ticket.created_by = userId;
            ticket.modified_by = userId;
        }

        return await _tuuaSalesOperationDao.Add(salesOperation);
    }

    // Turno abierto del usuario con su caja, terminal, sede y aeropuerto, más los catálogos del punto de venta.
    public async Task<TuuaSaleContext> GetSaleContext(string? userId)
    {
        var session = await GetOpenSession(userId);
        var cashierMachine = await _cashierMachineDao.GetByCode(session.cashier_machine_code)
                             ?? throw new Exception($"Cashier machine {session.cashier_machine_code} not found");

        var terminal = cashierMachine.terminal_id is null ? null : await _terminalDao.GetById(cashierMachine.terminal_id.Value);
        var location = cashierMachine.location_id is null ? null : await _locationDao.GetById(cashierMachine.location_id.Value);
        var airportId = terminal?.airport_id ?? location?.airport_id;
        var airport = airportId is null ? null : await _airportDao.GetById(airportId.Value);

        var currencies = await _featureDao.GetActiveByFeatureGroupName(CurrencyGroupName);
        var nationalCurrency = currencies.FirstOrDefault(c => c.feature_value == NationalCurrencyValue)
                               ?? throw new Exception($"National currency '{NationalCurrencyValue}' not found");

        var documentTypes = await _featureDao.GetActiveByFeatureGroupName(DocumentTypeGroupName);
        var paymentTypes = await _featureDao.GetActiveByFeatureGroupName(PaymentTypeGroupName);
        var flightTypes = await _featureDao.GetActiveByFeatureGroupName(FlightTypeGroupName);

        return new TuuaSaleContext
        {
            session = session,
            cashier_machine = cashierMachine,
            terminal = terminal,
            location = location,
            airport = airport,
            igv_rate = await GetIgvRate(),
            flight_days = await GetFlightDays(),
            national_currency_id = nationalCurrency.id,
            document_types = documentTypes.Where(d => SaleDocumentTypeValues.Contains(d.feature_value)).ToList(),
            sale_types = await _featureDao.GetActiveByFeatureGroupName(SaleTypeGroupName),
            payment_types = paymentTypes.Where(p => SalePaymentTypeValues.Contains(p.feature_value)).ToList(),
            currencies = currencies,
            flight_types = flightTypes.Where(f => f.feature_value != MixedFlightTypeValue).ToList()
        };
    }

    // Precio TUUA vigente para el tipo de vuelo en la caja del turno abierto y el último tipo de cambio
    // activo cuya moneda base es la del precio.
    public async Task<TuuaSalePricing> GetSalePricing(int flightTypeId, string? userId)
    {
        var session = await GetOpenSession(userId);
        var cashierMachine = await _cashierMachineDao.GetByCode(session.cashier_machine_code)
                             ?? throw new Exception($"Cashier machine {session.cashier_machine_code} not found");

        if (cashierMachine.location_id is null || cashierMachine.terminal_id is null)
        {
            throw new Exception($"Cashier machine {cashierMachine.code} has no location or terminal assigned");
        }

        var price = await _tuuaPriceDao.GetActivePriceForSale(flightTypeId, cashierMachine.location_id.Value,
                        cashierMachine.terminal_id.Value, DateTime.Today)
                    ?? throw new Exception("No active TUUA price found for the selected flight type");

        var exchangeRate = await _exchangeRateDao.GetLatestActiveByBaseCurrency(price.currency_id)
                           ?? throw new Exception("No active exchange rate found for the TUUA price currency");

        return new TuuaSalePricing { tuua_price = price, exchange_rate = exchangeRate };
    }

    // Vuelos del aeropuerto base de la caja desde hoy hasta hoy + "Dias Vuelos Venta".
    public async Task<IEnumerable<Flight>> GetFlightsForSale(int flightTypeId, string? userId)
    {
        var context = await GetSaleContext(userId);
        if (context.airport?.id is null)
        {
            throw new Exception($"Cashier machine {context.cashier_machine.code} has no airport assigned");
        }

        var today = DateTime.Today;
        return await _flightDao.GetForSale(context.airport.id.Value, flightTypeId, today,
            today.AddDays(context.flight_days));
    }

    // Registra la venta (operación, tickets con serie/correlativo y movimientos de caja) en una sola transacción.
    public async Task<TuuaSalesOperation> Sell(TuuaTicketSaleRequest request, string? userId)
    {
        var result = await _tuuaTicketSaleRequestValidator.ValidateAsync(request);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        var session = await GetOpenSession(userId);
        if (session.id != request.cashier_machine_session_id)
        {
            throw new Exception("The cashier machine session is not the user's open session");
        }

        return await _tuuaSalesOperationDao.Sell(request, userId);
    }

    // Búsqueda por rango de fechas (obligatorio, máximo 92 días), aeropuerto, terminal y estado.
    public async Task<IEnumerable<TuuaSalesOperationSearchItem>> Search(TuuaSalesOperationSearchFilter filter)
    {
        if (filter.date_from is null || filter.date_to is null)
        {
            throw new Exception("The date range is required");
        }

        if (filter.date_from.Value.Date > filter.date_to.Value.Date)
        {
            throw new Exception("The start date cannot be after the end date");
        }

        if ((filter.date_to.Value.Date - filter.date_from.Value.Date).TotalDays > MaxSearchDays)
        {
            throw new Exception($"The date range cannot exceed {MaxSearchDays} days");
        }

        return await _tuuaSalesOperationDao.Search(filter);
    }

    public async Task<TuuaSalesOperation?> GetByIdWithTickets(Guid id)
    {
        var salesOperation = await _tuuaSalesOperationDao.GetById(id);
        if (salesOperation is null)
        {
            return null;
        }

        salesOperation.tickets = await new TuuaTicketDao(_cnx).GetBySalesOperationId(id);
        return salesOperation;
    }

    private async Task<CashierMachineSession> GetOpenSession(string? userId)
    {
        if (!Guid.TryParse(userId, out var localUserId))
        {
            throw new Exception("Invalid user");
        }

        return await _cashierMachineSessionDao.GetOpenByLocalUserId(localUserId)
               ?? throw new Exception("The user has no open cashier machine session");
    }

    private async Task<decimal> GetIgvRate()
    {
        var parameters = await _featureDao.GetActiveByFeatureGroupName(AccountingParametersGroupName);
        var igv = parameters.FirstOrDefault(p => p.description?.Trim().ToLower() == "igv");
        if (igv is null || !decimal.TryParse(igv.feature_value, NumberStyles.Number, CultureInfo.InvariantCulture, out var rate))
        {
            throw new Exception("Accounting parameter 'IGV' not found or invalid");
        }

        // admite el IGV expresado como porcentaje (18) o como fracción (0.18)
        return rate > 1 ? rate / 100 : rate;
    }

    private async Task<int> GetFlightDays()
    {
        var parameters = await _featureDao.GetActiveByFeatureGroupName(SaleParametersGroupName);
        var flightDays = parameters.FirstOrDefault(p => p.description?.Trim().ToLower() == "dias vuelos venta");
        return int.TryParse(flightDays?.feature_value, out var days) && days >= 0 ? days : 0;
    }

    public async Task<TuuaSalesOperation> Update(TuuaSalesOperation salesOperation, string? userId)
    {
        var result = await _tuuaSalesOperationValidator.ValidateAsync(salesOperation);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        if (salesOperation.id is null || salesOperation.id == Guid.Empty)
        {
            throw new Exception("Tuua sales operation id is required");
        }

        var salesOperationDb = await _tuuaSalesOperationDao.GetById(salesOperation.id.Value);
        if (salesOperationDb is null)
        {
            throw new Exception("Tuua sales operation not found");
        }

        await ValidateReferences(salesOperation);

        salesOperation.created_at = salesOperationDb.created_at;
        salesOperation.created_by = salesOperationDb.created_by;
        salesOperation.updated_at = DateTime.Now;
        salesOperation.modified_by = userId;
        await _tuuaSalesOperationDao.Update(salesOperation);

        return salesOperation;
    }

    public async Task Delete(Guid id)
    {
        var salesOperationDb = await _tuuaSalesOperationDao.GetById(id);
        if (salesOperationDb is null)
        {
            throw new Exception("Tuua sales operation not found");
        }

        await _tuuaSalesOperationDao.Delete(id);
    }

    private static void ValidateTickets(TuuaSalesOperation salesOperation)
    {
        if (salesOperation.tickets.Count == 0)
        {
            throw new Exception("At least one tuua ticket is required");
        }

        if (salesOperation.tickets.Count != salesOperation.ticket_quantity)
        {
            throw new Exception("Ticket quantity does not match the number of tickets");
        }
    }

    private async Task ValidateReferences(TuuaSalesOperation salesOperation)
    {
        if (await _cashierMachineSessionDao.GetById(salesOperation.cashier_machine_session_id) is null)
        {
            throw new Exception("Cashier machine session not found");
        }

        if (await _featureDao.GetFeatureById(salesOperation.document_type_id) is null)
        {
            throw new Exception("Document type not found");
        }

        if (await _featureDao.GetFeatureById(salesOperation.seae_type_id) is null)
        {
            throw new Exception("Seae type not found");
        }

        if (await _featureDao.GetFeatureById(salesOperation.sale_type_id) is null)
        {
            throw new Exception("Sale type not found");
        }

        if (await _featureDao.GetFeatureById(salesOperation.currency_id) is null)
        {
            throw new Exception("Currency not found");
        }

        if (salesOperation.flight_type_id is not null &&
            await _featureDao.GetFeatureById(salesOperation.flight_type_id.Value) is null)
        {
            throw new Exception("Flight type not found");
        }

        if (salesOperation.airline_id is not null &&
            await _airlineDao.GetById(salesOperation.airline_id.Value) is null)
        {
            throw new Exception("Airline not found");
        }

        if (salesOperation.flight_id is not null &&
            await _flightDao.GetById(salesOperation.flight_id.Value) is null)
        {
            throw new Exception("Flight not found");
        }

        if (await _exchangeRateDao.GetById(salesOperation.exchange_rate_id) is null)
        {
            throw new Exception("Exchange rate not found");
        }

        if (await _tuuaPriceDao.GetById(salesOperation.tuua_price_id) is null)
        {
            throw new Exception("Tuua price not found");
        }

        if (await _featureDao.GetFeatureById(salesOperation.payment_type_id) is null)
        {
            throw new Exception("Payment type not found");
        }

        if (await _featureDao.GetFeatureById(salesOperation.status_id) is null)
        {
            throw new Exception("Tuua sales operation status not found");
        }

        foreach (var ticket in salesOperation.tickets)
        {
            await ValidateTicketReferences(ticket);
        }
    }

    private async Task ValidateTicketReferences(TuuaTicket ticket)
    {
        if (await _documentSequentialNumberDao.GetById(ticket.document_sequential_numbers_id) is null)
        {
            throw new Exception("Document sequential number not found");
        }

        if (!string.IsNullOrWhiteSpace(ticket.tuua_gate_code) &&
            await _tuuaGateDao.GetByCode(ticket.tuua_gate_code) is null)
        {
            throw new Exception("Tuua gate not found");
        }

        if (await _featureDao.GetFeatureById(ticket.status_id) is null)
        {
            throw new Exception("Tuua ticket status not found");
        }
    }
}
