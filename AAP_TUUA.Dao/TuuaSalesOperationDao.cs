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
                             cash_amount_payed, cash_change,
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
                             @cash_amount_payed, @cash_change,
                             @payment_id, @payment_authorization, @payment_card_brand, @payment_holder_name,
                             @payment_status, @payment_amount, @payment_currency, @payment_date, @payment_response,
                             @created_at, @updated_at, @created_by, @modified_by)
                         returning id;";
}
