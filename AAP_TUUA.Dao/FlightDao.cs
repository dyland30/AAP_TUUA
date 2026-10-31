using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class FlightDao
{
    private readonly string _cnx;

    public FlightDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<Flight>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<Flight>(
            "select * from public.flight order by scheduled_time desc");
        return result.ToList();
    }

    public async Task<List<Flight>> GetByAirportId(Guid airportId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<Flight>(
            "select * from public.flight where airport_id = @airportId order by scheduled_time desc",
            new { airportId });
        return result.ToList();
    }

    public async Task<List<Flight>> GetByScheduleDate(Guid airportId, DateTime scheduleDate)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<Flight>(
            @"select * from public.flight
              where airport_id = @airportId and schedule_date = @scheduleDate
              order by scheduled_time", new { airportId, scheduleDate });
        return result.ToList();
    }

    public async Task<List<Flight>> GetByAirlineId(Guid airlineId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<Flight>(
            "select * from public.flight where airline_id = @airlineId order by scheduled_time desc",
            new { airlineId });
        return result.ToList();
    }

    public async Task<List<Flight>> GetByStatusId(int statusId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<Flight>(
            "select * from public.flight where status_id = @statusId order by scheduled_time desc",
            new { statusId });
        return result.ToList();
    }

    public async Task<Flight?> GetByFlightIdentity(string flightIdentity, DateTime scheduleDate)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<Flight>(
            @"select * from public.flight
              where flight_identity = @flightIdentity and schedule_date = @scheduleDate", new { flightIdentity, scheduleDate });
    }

    public async Task<Flight?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<Flight>(
            "select * from public.flight where id = @id", new { id });
    }

    public async Task<Flight> Add(Flight flight)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.flight (airport_id, terminal_id, location_id, other_airport_id,
                             origin_airport_code, destination_airprt_code, flight_direction_id, flight_type_id,
                             service_type_id, aircraft_type_id, aircraft_id, airline_id, public_iata_code,
                             operational_iata_code, flight_number, flight_identity, schedule_date, scheduled_time,
                             estimated_time, actual_runway_time, actual_block_time, status_id, runway_id,
                             diverted_to_id, remarks, is_active, created_at, updated_at, created_by, modified_by)
                         values (@airport_id, @terminal_id, @location_id, @other_airport_id,
                             @origin_airport_code, @destination_airprt_code, @flight_direction_id, @flight_type_id,
                             @service_type_id, @aircraft_type_id, @aircraft_id, @airline_id, @public_iata_code,
                             @operational_iata_code, @flight_number, @flight_identity, @schedule_date, @scheduled_time,
                             @estimated_time, @actual_runway_time, @actual_block_time, @status_id, @runway_id,
                             @diverted_to_id, @remarks, @is_active, @created_at, @updated_at, @created_by, @modified_by)
                         returning id;";
        flight.id = await cnn.QueryFirstOrDefaultAsync<Guid>(query, flight);
        return flight;
    }

    public async Task Update(Flight flight)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.flight
                         set airport_id = @airport_id,
                             terminal_id = @terminal_id,
                             location_id = @location_id,
                             other_airport_id = @other_airport_id,
                             origin_airport_code = @origin_airport_code,
                             destination_airprt_code = @destination_airprt_code,
                             flight_direction_id = @flight_direction_id,
                             flight_type_id = @flight_type_id,
                             service_type_id = @service_type_id,
                             aircraft_type_id = @aircraft_type_id,
                             aircraft_id = @aircraft_id,
                             airline_id = @airline_id,
                             public_iata_code = @public_iata_code,
                             operational_iata_code = @operational_iata_code,
                             flight_number = @flight_number,
                             flight_identity = @flight_identity,
                             schedule_date = @schedule_date,
                             scheduled_time = @scheduled_time,
                             estimated_time = @estimated_time,
                             actual_runway_time = @actual_runway_time,
                             actual_block_time = @actual_block_time,
                             status_id = @status_id,
                             runway_id = @runway_id,
                             diverted_to_id = @diverted_to_id,
                             remarks = @remarks,
                             is_active = @is_active,
                             updated_at = @updated_at,
                             modified_by = @modified_by
                         where id = @id;";
        await cnn.ExecuteAsync(query, flight);
    }

    public async Task Delete(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync("delete from public.flight where id = @id", new { id });
    }
}
