using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class FlightStatusTransitionDao
{
    private readonly string _cnx;
    public FlightStatusTransitionDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<FlightStatusTransition>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<FlightStatusTransition>("select * from public.flight_status_transition order by from_status_id, to_status_id")).ToList();
    }

    public async Task<FlightStatusTransition?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<FlightStatusTransition>("select * from public.flight_status_transition where id = @id", new
        {
            id
        });
    }

    public async Task<List<FlightStatusTransition>> GetByFromStatusId(int fromStatusId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<FlightStatusTransition>("select * from public.flight_status_transition where from_status_id = @fromStatusId order by to_status_id", new
        {
            fromStatusId
        })).ToList();
    }

    public async Task<FlightStatusTransition> Add(FlightStatusTransition entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.flight_status_transition (from_status_id, to_status_id, applies_to_departure,
            applies_to_arrival, allowed_for_airline, is_active, created_at, updated_at, created_by, modified_by)
            values (@from_status_id, @to_status_id, @applies_to_departure, @applies_to_arrival, @allowed_for_airline,
            @is_active, @created_at, @updated_at, @created_by, @modified_by) returning id;";
        entity.id = await cnn.QuerySingleAsync<Guid>(query, entity);
        return entity;
    }

    public async Task Update(FlightStatusTransition entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.flight_status_transition set from_status_id = @from_status_id, to_status_id = @to_status_id,
            applies_to_departure = @applies_to_departure, applies_to_arrival = @applies_to_arrival,
            allowed_for_airline = @allowed_for_airline, is_active = @is_active,
            updated_at = @updated_at, modified_by = @modified_by where id = @id;";
        await cnn.ExecuteAsync(query, entity);
    }
}
