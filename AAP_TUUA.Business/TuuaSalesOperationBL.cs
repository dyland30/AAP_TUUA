using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class TuuaSalesOperationBL
{
    private readonly TuuaSalesOperationDao _tuuaSalesOperationDao;
    private readonly CashierMachineSessionDao _cashierMachineSessionDao;
    private readonly ExchangeRateDao _exchangeRateDao;
    private readonly TuuaPriceDao _tuuaPriceDao;
    private readonly AirlineDao _airlineDao;
    private readonly FlightDao _flightDao;
    private readonly DocumentSequentialNumberDao _documentSequentialNumberDao;
    private readonly TuuaGateDao _tuuaGateDao;
    private readonly FeatureDao _featureDao;
    private readonly TuuaSalesOperationValidator _tuuaSalesOperationValidator;

    public TuuaSalesOperationBL(string cnx)
    {
        _tuuaSalesOperationDao = new TuuaSalesOperationDao(cnx);
        _cashierMachineSessionDao = new CashierMachineSessionDao(cnx);
        _exchangeRateDao = new ExchangeRateDao(cnx);
        _tuuaPriceDao = new TuuaPriceDao(cnx);
        _airlineDao = new AirlineDao(cnx);
        _flightDao = new FlightDao(cnx);
        _documentSequentialNumberDao = new DocumentSequentialNumberDao(cnx);
        _tuuaGateDao = new TuuaGateDao(cnx);
        _featureDao = new FeatureDao(cnx);
        _tuuaSalesOperationValidator = new TuuaSalesOperationValidator();
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
