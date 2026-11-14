using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class FlightChangeHistoryDao
{
    private readonly string _cnx;
    public FlightChangeHistoryDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<FlightChangeHistory>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<FlightChangeHistory>("select * from public.flight_change_history order by changed_at desc, id desc")).ToList();
    }

    public async Task<FlightChangeHistory?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<FlightChangeHistory>("select * from public.flight_change_history where id = @id", new
        {
            id
        });
    }

    public async Task<List<FlightChangeHistory>> GetByFlightId(Guid flightId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<FlightChangeHistory>("select * from public.flight_change_history where flight_id = @flightId order by changed_at desc, id desc", new
        {
            flightId
        })).ToList();
    }

    public async Task<FlightChangeHistory> Add(FlightChangeHistory entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.flight_change_history (flight_id, field_name, old_value, new_value, source_id,
            integration_message_id, was_rejected_by_lock, changed_at, changed_by, created_at, updated_at, created_by, modified_by)
            values (@flight_id, @field_name, @old_value, @new_value, @source_id, @integration_message_id,
            @was_rejected_by_lock, @changed_at, @changed_by, @created_at, @updated_at, @created_by, @modified_by) returning id;";
        entity.id = await cnn.QuerySingleAsync<Guid>(query, entity);
        return entity;
    }
}
