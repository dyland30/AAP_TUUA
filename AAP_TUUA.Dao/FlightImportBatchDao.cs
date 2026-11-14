using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class FlightImportBatchDao
{
    private readonly string _cnx;
    public FlightImportBatchDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<FlightImportBatch>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<FlightImportBatch>("select * from public.flight_import_batch order by created_at desc, id desc")).ToList();
    }

    public async Task<FlightImportBatch?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<FlightImportBatch>("select * from public.flight_import_batch where id = @id", new
        {
            id
        });
    }

    public async Task<List<FlightImportBatch>> GetByAirportId(Guid airportId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<FlightImportBatch>("select * from public.flight_import_batch where airport_id = @airportId order by created_at desc, id desc", new
        {
            airportId
        })).ToList();
    }

    public async Task<FlightImportBatch> Add(FlightImportBatch entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.flight_import_batch (airport_id, file_type_id, status_id, file_name, file_size_bytes,
            storage_path, airline_id, date_from, date_to, total_rows, valid_rows, error_rows, duplicate_rows, imported_rows,
            is_scheduled, validated_at, confirmed_at, confirmed_by, error_report_path, observation, is_active,
            created_at, updated_at, created_by, modified_by)
            values (@airport_id, @file_type_id, @status_id, @file_name, @file_size_bytes, @storage_path, @airline_id,
            cast(@date_from as date), cast(@date_to as date), @total_rows, @valid_rows, @error_rows, @duplicate_rows,
            @imported_rows, @is_scheduled, @validated_at, @confirmed_at, @confirmed_by, @error_report_path, @observation,
            @is_active, @created_at, @updated_at, @created_by, @modified_by) returning id;";
        entity.id = await cnn.QuerySingleAsync<Guid>(query, entity);
        return entity;
    }

    public async Task Update(FlightImportBatch entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.flight_import_batch set airport_id = @airport_id, file_type_id = @file_type_id,
            status_id = @status_id, file_name = @file_name, file_size_bytes = @file_size_bytes, storage_path = @storage_path,
            airline_id = @airline_id, date_from = cast(@date_from as date), date_to = cast(@date_to as date), total_rows = @total_rows,
            valid_rows = @valid_rows, error_rows = @error_rows, duplicate_rows = @duplicate_rows, imported_rows = @imported_rows,
            is_scheduled = @is_scheduled, validated_at = @validated_at, confirmed_at = @confirmed_at, confirmed_by = @confirmed_by,
            error_report_path = @error_report_path, observation = @observation, is_active = @is_active,
            updated_at = @updated_at, modified_by = @modified_by where id = @id;";
        await cnn.ExecuteAsync(query, entity);
    }
}
