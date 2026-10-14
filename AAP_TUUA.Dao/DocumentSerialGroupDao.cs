using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class DocumentSerialGroupDao
{
    private readonly string _cnx;

    public DocumentSerialGroupDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<DocumentSerialGroup>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<DocumentSerialGroup>(
            "select * from public.document_serial_group order by serial_prefix");
        return result.ToList();
    }

    public async Task<DocumentSerialGroup?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<DocumentSerialGroup>(
            "select * from public.document_serial_group where id = @id", new { id });
    }

    public async Task<DocumentSerialGroup> Add(DocumentSerialGroup group)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.document_serial_group (document_type_id, seae_type_id, sale_type_id,
                             location_id, terminal_id, serial_prefix, serial_start, serial_end, is_active,
                             created_at, updated_at, created_by, modified_by)
                         values (@document_type_id, @seae_type_id, @sale_type_id,
                             @location_id, @terminal_id, @serial_prefix, @serial_start, @serial_end, @is_active,
                             @created_at, @updated_at, @created_by, @modified_by)
                         returning id;";
        group.id = await cnn.QueryFirstOrDefaultAsync<Guid>(query, group);
        return group;
    }

    public async Task Update(DocumentSerialGroup group)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.document_serial_group
                         set document_type_id = @document_type_id,
                             seae_type_id = @seae_type_id,
                             sale_type_id = @sale_type_id,
                             location_id = @location_id,
                             terminal_id = @terminal_id,
                             serial_prefix = @serial_prefix,
                             serial_start = @serial_start,
                             serial_end = @serial_end,
                             is_active = @is_active,
                             updated_at = @updated_at,
                             modified_by = @modified_by
                         where id = @id;";
        await cnn.ExecuteAsync(query, group);
    }

    public async Task SoftDelete(DocumentSerialGroup group)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync(
            @"update public.document_serial_group
              set is_active = @is_active,
                  updated_at = @updated_at,
                  modified_by = @modified_by
              where id = @id;", group);
    }
}
