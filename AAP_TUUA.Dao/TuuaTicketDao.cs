using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class TuuaTicketDao
{
    private readonly string _cnx;

    public TuuaTicketDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<TuuaTicket>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<TuuaTicket>(
            "select * from public.tuua_ticket order by created_at desc, id desc");
        return result.ToList();
    }

    public async Task<TuuaTicket?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<TuuaTicket>(
            "select * from public.tuua_ticket where id = @id", new { id });
    }

    public async Task<List<TuuaTicket>> GetBySalesOperationId(Guid tuuaSalesOperationId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<TuuaTicket>(
            @"select * from public.tuua_ticket
              where tuua_sales_operation_id = @tuuaSalesOperationId
              order by sequential_number", new { tuuaSalesOperationId });
        return result.ToList();
    }

    public async Task<List<TuuaTicket>> GetByDocumentSequentialNumbersId(Guid documentSequentialNumbersId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<TuuaTicket>(
            @"select * from public.tuua_ticket
              where document_sequential_numbers_id = @documentSequentialNumbersId
              order by sequential_number", new { documentSequentialNumbersId });
        return result.ToList();
    }

    public async Task<TuuaTicket?> GetBySerialAndSequentialNumber(string serial, long sequentialNumber)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<TuuaTicket>(
            @"select * from public.tuua_ticket
              where serial = @serial and sequential_number = @sequentialNumber", new { serial, sequentialNumber });
    }

    public async Task<TuuaTicket> Add(TuuaTicket ticket)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        ticket.id = await cnn.QueryFirstOrDefaultAsync<Guid>(InsertQuery, ticket);
        return ticket;
    }

    public async Task Update(TuuaTicket ticket)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.tuua_ticket
                         set tuua_sales_operation_id = @tuua_sales_operation_id,
                             document_sequential_numbers_id = @document_sequential_numbers_id,
                             tuua_gate_code = @tuua_gate_code,
                             serial = @serial,
                             sequential_number = @sequential_number,
                             hash_ticket = @hash_ticket,
                             status_id = @status_id,
                             price = @price,
                             subtotal = @subtotal,
                             total = @total,
                             igv_tax_amount = @igv_tax_amount,
                             utilization_date = @utilization_date,
                             due_date = @due_date,
                             updated_at = @updated_at,
                             modified_by = @modified_by
                         where id = @id;";
        await cnn.ExecuteAsync(query, ticket);
    }

    public async Task Delete(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync("delete from public.tuua_ticket where id = @id", new { id });
    }

    internal const string InsertQuery = @"insert into public.tuua_ticket (tuua_sales_operation_id,
                             document_sequential_numbers_id, tuua_gate_code, serial, sequential_number,
                             hash_ticket, status_id, price, subtotal, total, igv_tax_amount,
                             utilization_date, due_date, created_at, updated_at, created_by, modified_by)
                         values (@tuua_sales_operation_id,
                             @document_sequential_numbers_id, @tuua_gate_code, @serial, @sequential_number,
                             @hash_ticket, @status_id, @price, @subtotal, @total, @igv_tax_amount,
                             @utilization_date, @due_date, @created_at, @updated_at, @created_by, @modified_by)
                         returning id;";
}
