using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class FlightTimingRuleDao
{
    private readonly string _cnx;
    public FlightTimingRuleDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<FlightTimingRule>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<FlightTimingRule>("select * from public.flight_timing_rule order by priority, id")).ToList();
    }

    public async Task<FlightTimingRule?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<FlightTimingRule>("select * from public.flight_timing_rule where id = @id", new
        {
            id
        });
    }

    public async Task<List<FlightTimingRule>> GetByAirportId(Guid airportId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<FlightTimingRule>("select * from public.flight_timing_rule where airport_id = @airportId order by priority, id", new
        {
            airportId
        })).ToList();
    }

    public async Task<FlightTimingRule> Add(FlightTimingRule entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.flight_timing_rule (airport_id, terminal_id, airport_sector_id, event_type_id,
            reference_time_id, flight_direction_id, flight_type_id, airline_id, destination_airport_id, resource_type_id,
            offset_minutes, priority, description, is_active, created_at, updated_at, created_by, modified_by)
            values (@airport_id, @terminal_id, @airport_sector_id, @event_type_id, @reference_time_id, @flight_direction_id,
            @flight_type_id, @airline_id, @destination_airport_id, @resource_type_id, @offset_minutes, @priority,
            @description, @is_active, @created_at, @updated_at, @created_by, @modified_by) returning id;";
        entity.id = await cnn.QuerySingleAsync<Guid>(query, entity);
        return entity;
    }

    public async Task Update(FlightTimingRule entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.flight_timing_rule set airport_id = @airport_id, terminal_id = @terminal_id,
            airport_sector_id = @airport_sector_id, event_type_id = @event_type_id, reference_time_id = @reference_time_id,
            flight_direction_id = @flight_direction_id, flight_type_id = @flight_type_id, airline_id = @airline_id,
            destination_airport_id = @destination_airport_id, resource_type_id = @resource_type_id,
            offset_minutes = @offset_minutes, priority = @priority, description = @description, is_active = @is_active,
            updated_at = @updated_at, modified_by = @modified_by where id = @id;";
        await cnn.ExecuteAsync(query, entity);
    }
}
