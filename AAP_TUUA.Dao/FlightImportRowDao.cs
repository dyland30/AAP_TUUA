using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class FlightImportRowDao
{
    private readonly string _cnx;
    public FlightImportRowDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<FlightImportRow>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<FlightImportRow>("select * from public.flight_import_row order by flight_import_batch_id, row_number")).ToList();
    }

    public async Task<FlightImportRow?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<FlightImportRow>("select * from public.flight_import_row where id = @id", new
        {
            id
        });
    }

    public async Task<List<FlightImportRow>> GetByFlightImportBatchId(Guid flightImportBatchId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<FlightImportRow>("select * from public.flight_import_row where flight_import_batch_id = @flightImportBatchId order by row_number", new
        {
            flightImportBatchId
        })).ToList();
    }

    public async Task<FlightImportRow> Add(FlightImportRow entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.flight_import_row (flight_import_batch_id, row_number, status_id,
            reconciliation_action_id, is_selected, airline_code, airline_id, flight_number, flight_direction_code,
            origin_airport_code, destination_airport_code, flight_date, scheduled_time_utc, scheduled_time_local,
            service_type_code, aircraft_type_code, days_of_week, valid_from, valid_to, raw_data, error_detail,
            existing_flight_id, flight_id, created_at, updated_at, created_by, modified_by)
            values (@flight_import_batch_id, @row_number, @status_id, @reconciliation_action_id, @is_selected,
            @airline_code, @airline_id, @flight_number, @flight_direction_code, @origin_airport_code, @destination_airport_code,
            cast(@flight_date as date), @scheduled_time_utc, @scheduled_time_local, @service_type_code, @aircraft_type_code,
            @days_of_week, cast(@valid_from as date), cast(@valid_to as date), cast(@raw_data as jsonb), @error_detail,
            @existing_flight_id, @flight_id, @created_at, @updated_at, @created_by, @modified_by) returning id;";
        entity.id = await cnn.QuerySingleAsync<Guid>(query, entity);
        return entity;
    }

    public async Task Update(FlightImportRow entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.flight_import_row set flight_import_batch_id = @flight_import_batch_id,
            row_number = @row_number, status_id = @status_id, reconciliation_action_id = @reconciliation_action_id,
            is_selected = @is_selected, airline_code = @airline_code, airline_id = @airline_id, flight_number = @flight_number,
            flight_direction_code = @flight_direction_code, origin_airport_code = @origin_airport_code,
            destination_airport_code = @destination_airport_code, flight_date = cast(@flight_date as date),
            scheduled_time_utc = @scheduled_time_utc, scheduled_time_local = @scheduled_time_local, service_type_code = @service_type_code,
            aircraft_type_code = @aircraft_type_code, days_of_week = @days_of_week, valid_from = cast(@valid_from as date),
            valid_to = cast(@valid_to as date), raw_data = cast(@raw_data as jsonb), error_detail = @error_detail,
            existing_flight_id = @existing_flight_id, flight_id = @flight_id, updated_at = @updated_at, modified_by = @modified_by where id = @id;";
        await cnn.ExecuteAsync(query, entity);
    }

    public async Task Delete(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync("delete from public.flight_import_row where id = @id", new
        {
            id
        });
    }
}
