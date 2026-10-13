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
        var group = await cnn.QueryFirstOrDefaultAsync<DocumentSerialGroup>(
            "select * from public.document_serial_group where id = @id", new { id });

        if (group is not null)
        {
            var details = await cnn.QueryAsync<DocumentSequentialNumber>(
                @"select * from public.document_sequential_numbers
                  where document_serial_group_id = @id
                  order by serial_number", new { id });
            group.sequential_numbers = details.ToList();
        }

        return group;
    }

    public async Task<DocumentSerialGroup> Add(DocumentSerialGroup group)
    {
        using var cnn = new NpgsqlConnection(_cnx);
        await cnn.OpenAsync();
        using var tx = await cnn.BeginTransactionAsync();

        string query = @"insert into public.document_serial_group (document_type_id, seae_type_id, sale_type_id,
                             location_id, terminal_id, serial_prefix, serial_start, serial_end, is_active,
                             created_at, updated_at, created_by, modified_by)
                         values (@document_type_id, @seae_type_id, @sale_type_id,
                             @location_id, @terminal_id, @serial_prefix, @serial_start, @serial_end, @is_active,
                             @created_at, @updated_at, @created_by, @modified_by)
                         returning id;";
        group.id = await cnn.QueryFirstOrDefaultAsync<Guid>(query, group, tx);

        await InsertDetails(cnn, tx, group);

        await tx.CommitAsync();
        return group;
    }

    public async Task Update(DocumentSerialGroup group)
    {
        using var cnn = new NpgsqlConnection(_cnx);
        await cnn.OpenAsync();
        using var tx = await cnn.BeginTransactionAsync();

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
        await cnn.ExecuteAsync(query, group, tx);

        await cnn.ExecuteAsync(
            "delete from public.document_sequential_numbers where document_serial_group_id = @id",
            new { group.id }, tx);

        await InsertDetails(cnn, tx, group);

        await tx.CommitAsync();
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

    private static async Task InsertDetails(NpgsqlConnection cnn, NpgsqlTransaction tx, DocumentSerialGroup group)
    {
        if (group.sequential_numbers is null || group.sequential_numbers.Count == 0)
        {
            return;
        }

        string detailQuery = @"insert into public.document_sequential_numbers (document_serial_group_id,
                                    cashier_code, serial_number, max_sequential_number, is_active,
                                    created_at, updated_at, created_by, modified_by)
                               values (@document_serial_group_id, @cashier_code, @serial_number, @max_sequential_number, @is_active,
                                    @created_at, @updated_at, @created_by, @modified_by);";

        foreach (var detail in group.sequential_numbers)
        {
            detail.document_serial_group_id = group.id;
            await cnn.ExecuteAsync(detailQuery, detail, tx);
        }
    }
}
