using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class AirportResourceAllocationHistoryDao
{
    private readonly string _cnx;
    public AirportResourceAllocationHistoryDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<AirportResourceAllocationHistory>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<AirportResourceAllocationHistory>("select * from public.airport_resource_allocation_history order by action_at desc, id desc")).ToList();
    }

    public async Task<AirportResourceAllocationHistory?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<AirportResourceAllocationHistory>("select * from public.airport_resource_allocation_history where id = @id", new
        {
            id
        });
    }

    public async Task<List<AirportResourceAllocationHistory>> GetByAirportResourceAllocationId(Guid airportResourceAllocationId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<AirportResourceAllocationHistory>("select * from public.airport_resource_allocation_history where airport_resource_allocation_id = @airportResourceAllocationId order by action_at desc, id desc", new
        {
            airportResourceAllocationId
        })).ToList();
    }

    public async Task<AirportResourceAllocationHistory> Add(AirportResourceAllocationHistory entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.airport_resource_allocation_history (airport_resource_allocation_id,
            airport_resource_id, flight_id, airline_id, action_id, previous_resource_id, action_at, action_by,
            source_id, notes, created_at, updated_at, created_by, modified_by)
            values (@airport_resource_allocation_id, @airport_resource_id, @flight_id, @airline_id, @action_id,
            @previous_resource_id, @action_at, @action_by, @source_id, @notes, @created_at, @updated_at, @created_by, @modified_by) returning id;";
        entity.id = await cnn.QuerySingleAsync<Guid>(query, entity);
        return entity;
    }
}
