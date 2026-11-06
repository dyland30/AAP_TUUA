using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class TuuaSalesOperationDao
{
    private readonly string _cnx;

    public TuuaSalesOperationDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<TuuaSalesOperation>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<TuuaSalesOperation>(
            "select * from public.tuua_sales_operation order by operation_date desc");
        return result.ToList();
    }

    public async Task<TuuaSalesOperation?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<TuuaSalesOperation>(
            "select * from public.tuua_sales_operation where id = @id", new { id });
    }

    public async Task<List<TuuaSalesOperation>> GetByCashierMachineSessionId(Guid cashierMachineSessionId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<TuuaSalesOperation>(
            @"select * from public.tuua_sales_operation
              where cashier_machine_session_id = @cashierMachineSessionId
              order by operation_date desc", new { cashierMachineSessionId });
        return result.ToList();
    }

    public const int MaxSearchResults = 500;

    // Operaciones de venta con su caja, terminal y aeropuerto (según la caja del turno) y sus tickets.
    public async Task<List<TuuaSalesOperationSearchItem>> Search(TuuaSalesOperationSearchFilter filter)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var operations = (await cnn.QueryAsync<TuuaSalesOperationSearchItem>(
            @"select so.*,
                     cms.cashier_machine_code,
                     cm.terminal_id,
                     t.name as terminal_name,
                     t.airport_id,
                     a.name as airport_name,
                     a.iata_code as airport_iata_code
              from public.tuua_sales_operation as so
                   inner join public.cashier_machine_session as cms on cms.id = so.cashier_machine_session_id
                   left join public.cashier_machine as cm on cm.code = cms.cashier_machine_code
                   left join public.terminal as t on t.id = cm.terminal_id
                   left join public.airport as a on a.id = t.airport_id
              where so.operation_date >= @dateFrom
                and so.operation_date < @dateToExclusive
                and (@airportId::uuid is null or t.airport_id = @airportId::uuid)
                and (@terminalId::uuid is null or cm.terminal_id = @terminalId::uuid)
                and (@statusId::integer is null or so.status_id = @statusId::integer)
              order by so.operation_date desc
              limit @limit",
            new
            {
                dateFrom = filter.date_from!.Value.Date,
                dateToExclusive = filter.date_to!.Value.Date.AddDays(1),
                airportId = filter.airport_id,
                terminalId = filter.terminal_id,
                statusId = filter.status_id,
                limit = MaxSearchResults
            })).ToList();

        if (operations.Count == 0)
        {
            return operations;
        }

        var ids = operations.Select(o => o.id!.Value).ToArray();
        var tickets = await cnn.QueryAsync<TuuaTicket>(
            @"select * from public.tuua_ticket
              where tuua_sales_operation_id = any(@ids)
              order by serial, sequential_number", new { ids });
        var ticketsByOperation = tickets.GroupBy(t => t.tuua_sales_operation_id!.Value)
            .ToDictionary(g => g.Key, g => g.ToList());

        foreach (var operation in operations)
        {
            operation.tickets = ticketsByOperation.GetValueOrDefault(operation.id!.Value) ?? new List<TuuaTicket>();
        }

        return operations;
    }

    // Registra la operación de venta y su lista de tickets dentro de una única transacción.
    public async Task<TuuaSalesOperation> Add(TuuaSalesOperation salesOperation)
    {
        await using var cnn = new NpgsqlConnection(_cnx);
        await cnn.OpenAsync();
        await using var tx = await cnn.BeginTransactionAsync();

        try
        {
            salesOperation.id = await cnn.QueryFirstOrDefaultAsync<Guid>(InsertQuery, salesOperation, tx);

            foreach (var ticket in salesOperation.tickets)
            {
                ticket.tuua_sales_operation_id = salesOperation.id;
                ticket.id = await cnn.QueryFirstOrDefaultAsync<Guid>(TuuaTicketDao.InsertQuery, ticket, tx);
            }

            await tx.CommitAsync();
            return salesOperation;
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    // Registra la venta de tickets mediante usp_insert_tuua_sales_operation, que asigna serie y correlativo,
    // calcula los importes y genera los movimientos de caja. Devuelve la venta con sus tickets.
    public async Task<TuuaSalesOperation> Sell(TuuaTicketSaleRequest request, string? user)
    {
        await using var cnn = new NpgsqlConnection(_cnx);
        await cnn.OpenAsync();
        await using var tx = await cnn.BeginTransactionAsync();

        try
        {
            const string query = @"call public.usp_insert_tuua_sales_operation(
                                       @p_cashier_machine_session_id::uuid,
                                       @p_document_type_id::integer,
                                       @p_sale_type_id::integer,
                                       @p_flight_type_id::integer,
                                       @p_flight_id::uuid,
                                       @p_passenger_name::varchar,
                                       @p_passenger_email::varchar,
                                       @p_ticket_quantity::integer,
                                       @p_payment_type_id::integer,
                                       @p_cash_payment_currency_id::integer,
                                       @p_cash_amount_payed::numeric,
                                       @p_cash_change_currency_id::integer,
                                       @p_user::varchar,
                                       null::uuid)";

            var salesOperationId = await cnn.QuerySingleAsync<Guid>(query, new
            {
                p_cashier_machine_session_id = request.cashier_machine_session_id,
                p_document_type_id = request.document_type_id,
                p_sale_type_id = request.sale_type_id,
                p_flight_type_id = request.flight_type_id,
                p_flight_id = request.flight_id,
                p_passenger_name = request.titular_passenger_name,
                p_passenger_email = request.passenger_email,
                p_ticket_quantity = request.ticket_quantity,
                p_payment_type_id = request.payment_type_id,
                p_cash_payment_currency_id = request.cash_payment_currency_id,
                p_cash_amount_payed = request.cash_amount_payed,
                p_cash_change_currency_id = request.cash_change_currency_id,
                p_user = user
            }, tx);

            var salesOperation = await cnn.QuerySingleAsync<TuuaSalesOperation>(
                "select * from public.tuua_sales_operation where id = @salesOperationId", new { salesOperationId }, tx);
            var tickets = await cnn.QueryAsync<TuuaTicket>(
                @"select * from public.tuua_ticket
                  where tuua_sales_operation_id = @salesOperationId
                  order by sequential_number", new { salesOperationId }, tx);
            salesOperation.tickets = tickets.ToList();

            await tx.CommitAsync();
            return salesOperation;
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    public async Task Update(TuuaSalesOperation salesOperation)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.tuua_sales_operation
                         set cashier_machine_session_id = @cashier_machine_session_id,
                             operation_date = @operation_date,
                             document_type_id = @document_type_id,
                             seae_type_id = @seae_type_id,
                             sale_type_id = @sale_type_id,
                             currency_id = @currency_id,
                             flight_type_id = @flight_type_id,
                             airline_id = @airline_id,
                             flight_number = @flight_number,
                             flight_date = @flight_date,
                             flight_id = @flight_id,
                             titular_passenger_name = @titular_passenger_name,
                             passenger_email = @passenger_email,
                             exchange_rate_id = @exchange_rate_id,
                             purchase_exchange_rate = @purchase_exchange_rate,
                             sales_exchange_rate = @sales_exchange_rate,
                             payment_type_id = @payment_type_id,
                             status_id = @status_id,
                             ticket_quantity = @ticket_quantity,
                             unit_price = @unit_price,
                             tuua_price_id = @tuua_price_id,
                             subtotal = @subtotal,
                             total = @total,
                             igv_tax_amount = @igv_tax_amount,
                             cash_amount_payed = @cash_amount_payed,
                             cash_change = @cash_change,
                             cash_payment_currency_id = @cash_payment_currency_id,
                             cash_change_currency_id = @cash_change_currency_id,
                             payment_id = @payment_id,
                             payment_authorization = @payment_authorization,
                             payment_card_brand = @payment_card_brand,
                             payment_holder_name = @payment_holder_name,
                             payment_status = @payment_status,
                             payment_amount = @payment_amount,
                             payment_currency = @payment_currency,
                             payment_date = @payment_date,
                             payment_response = @payment_response,
                             updated_at = @updated_at,
                             modified_by = @modified_by
                         where id = @id;";
        await cnn.ExecuteAsync(query, salesOperation);
    }

    public async Task Delete(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync("delete from public.tuua_sales_operation where id = @id", new { id });
    }

    private const string InsertQuery = @"insert into public.tuua_sales_operation (cashier_machine_session_id,
                             operation_date, document_type_id, seae_type_id, sale_type_id, currency_id,
                             flight_type_id, airline_id, flight_number, flight_date, flight_id,
                             titular_passenger_name, passenger_email,
                             exchange_rate_id, purchase_exchange_rate, sales_exchange_rate,
                             payment_type_id, status_id,
                             ticket_quantity, unit_price, tuua_price_id,
                             subtotal, total, igv_tax_amount,
                             cash_amount_payed, cash_change, cash_payment_currency_id, cash_change_currency_id,
                             payment_id, payment_authorization, payment_card_brand, payment_holder_name,
                             payment_status, payment_amount, payment_currency, payment_date, payment_response,
                             created_at, updated_at, created_by, modified_by)
                         values (@cashier_machine_session_id,
                             @operation_date, @document_type_id, @seae_type_id, @sale_type_id, @currency_id,
                             @flight_type_id, @airline_id, @flight_number, @flight_date, @flight_id,
                             @titular_passenger_name, @passenger_email,
                             @exchange_rate_id, @purchase_exchange_rate, @sales_exchange_rate,
                             @payment_type_id, @status_id,
                             @ticket_quantity, @unit_price, @tuua_price_id,
                             @subtotal, @total, @igv_tax_amount,
                             @cash_amount_payed, @cash_change, @cash_payment_currency_id, @cash_change_currency_id,
                             @payment_id, @payment_authorization, @payment_card_brand, @payment_holder_name,
                             @payment_status, @payment_amount, @payment_currency, @payment_date, @payment_response,
                             @created_at, @updated_at, @created_by, @modified_by)
                         returning id;";
}
