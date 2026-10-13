using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class DocumentSequentialNumberDao
{
    private readonly string _cnx;

    public DocumentSequentialNumberDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<DocumentSequentialNumber>> GetByGroupId(Guid documentSerialGroupId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<DocumentSequentialNumber>(
            @"select * from public.document_sequential_numbers
              where document_serial_group_id = @documentSerialGroupId
              order by serial_number", new { documentSerialGroupId });
        return result.ToList();
    }

    public async Task<DocumentSequentialNumber?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<DocumentSequentialNumber>(
            "select * from public.document_sequential_numbers where id = @id", new { id });
    }

    public async Task<DocumentSequentialNumber> Add(DocumentSequentialNumber number)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.document_sequential_numbers (document_serial_group_id,
                             cashier_code, serial_number, max_sequential_number, is_active,
                             created_at, updated_at, created_by, modified_by)
                         values (@document_serial_group_id, @cashier_code, @serial_number, @max_sequential_number, @is_active,
                             @created_at, @updated_at, @created_by, @modified_by)
                         returning id;";
        number.id = await cnn.QueryFirstOrDefaultAsync<Guid>(query, number);
        return number;
    }

    public async Task Update(DocumentSequentialNumber number)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.document_sequential_numbers
                         set document_serial_group_id = @document_serial_group_id,
                             cashier_code = @cashier_code,
                             serial_number = @serial_number,
                             max_sequential_number = @max_sequential_number,
                             is_active = @is_active,
                             updated_at = @updated_at,
                             modified_by = @modified_by
                         where id = @id;";
        await cnn.ExecuteAsync(query, number);
    }

    public async Task Delete(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync("delete from public.document_sequential_numbers where id = @id", new { id });
    }
}
