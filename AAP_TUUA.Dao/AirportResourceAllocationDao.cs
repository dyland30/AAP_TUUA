using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class AirportResourceAllocationDao
{
    private readonly string _cnx;

    public AirportResourceAllocationDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<AirportResourceAllocation>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<AirportResourceAllocation>(
            "select * from public.airport_resource_allocation order by star_time desc");
        return result.ToList();
    }

    public async Task<List<AirportResourceAllocation>> GetByAirportResourceId(Guid airportResourceId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<AirportResourceAllocation>(
            @"select * from public.airport_resource_allocation
              where airport_resource_id = @airportResourceId
              order by star_time desc", new { airportResourceId });
        return result.ToList();
    }

    public async Task<List<AirportResourceAllocation>> GetByFlightId(Guid flightId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<AirportResourceAllocation>(
            @"select * from public.airport_resource_allocation
              where flight_id = @flightId
              order by star_time desc", new { flightId });
        return result.ToList();
    }

    public async Task<List<AirportResourceAllocation>> GetByTurnaroundId(Guid turnaroundId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<AirportResourceAllocation>(
            @"select * from public.airport_resource_allocation
              where turnaround_id = @turnaroundId
              order by star_time desc", new { turnaroundId });
        return result.ToList();
    }

    public async Task<List<AirportResourceAllocation>> GetByAirlineId(Guid airlineId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<AirportResourceAllocation>(
            @"select * from public.airport_resource_allocation
              where airline_id = @airlineId
              order by star_time desc", new { airlineId });
        return result.ToList();
    }

    public async Task<List<AirportResourceAllocation>> GetActiveByAirportResourceId(Guid airportResourceId, DateTime date)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<AirportResourceAllocation>(
            @"select * from public.airport_resource_allocation
              where airport_resource_id = @airportResourceId
                and is_active = true
                and star_time <= @date
                and (end_time is null or end_time >= @date)
              order by star_time desc", new { airportResourceId, date });
        return result.ToList();
    }

    public async Task<AirportResourceAllocation?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<AirportResourceAllocation>(
            "select * from public.airport_resource_allocation where id = @id", new { id });
    }

    public async Task<AirportResourceAllocation> Add(AirportResourceAllocation allocation)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.airport_resource_allocation (airport_resource_id, flight_id, turnaround_id,
                             airline_id, star_time, end_time, actual_start_time, actual_end_time, display_order,
                             is_auto_calculated, display_airline_id, status_id, is_shared, notes, is_active,
                             created_at, updated_at, created_by, modified_by)
                         values (@airport_resource_id, @flight_id, @turnaround_id,
                             @airline_id, @star_time, @end_time, @actual_start_time, @actual_end_time, @display_order,
                             @is_auto_calculated, @display_airline_id, @status_id, @is_shared, @notes, @is_active,
                             @created_at, @updated_at, @created_by, @modified_by)
                         returning id;";
        allocation.id = await cnn.QueryFirstOrDefaultAsync<Guid>(query, allocation);
        return allocation;
    }

    public async Task Update(AirportResourceAllocation allocation)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.airport_resource_allocation
                         set airport_resource_id = @airport_resource_id,
                             flight_id = @flight_id,
                             turnaround_id = @turnaround_id,
                             airline_id = @airline_id,
                             star_time = @star_time,
                             end_time = @end_time,
                             actual_start_time = @actual_start_time,
                             actual_end_time = @actual_end_time,
                             display_order = @display_order,
                             is_auto_calculated = @is_auto_calculated,
                             display_airline_id = @display_airline_id,
                             status_id = @status_id,
                             is_shared = @is_shared,
                             notes = @notes,
                             is_active = @is_active,
                             updated_at = @updated_at,
                             modified_by = @modified_by
                         where id = @id;";
        await cnn.ExecuteAsync(query, allocation);
    }

    public async Task Delete(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync("delete from public.airport_resource_allocation where id = @id", new { id });
    }
}
