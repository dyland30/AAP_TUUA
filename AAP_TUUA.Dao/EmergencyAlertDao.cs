using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class EmergencyAlertDao
{
    private readonly string _cnx;
    public EmergencyAlertDao(string cnx)
    {
        _cnx = cnx;
    }
    public async Task<List<EmergencyAlert>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<EmergencyAlert>("select * from public.emergency_alert order by requested_at desc, id desc")).ToList();
    }
    public async Task<EmergencyAlert?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<EmergencyAlert>("select * from public.emergency_alert where id = @id", new
        {
            id
        });
    }
    public async Task<List<EmergencyAlert>> GetByAirportId(Guid airportId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<EmergencyAlert>("select * from public.emergency_alert where airport_id = @airportId order by requested_at desc, id desc", new
        {
            airportId
        })).ToList();
    }
    public async Task<EmergencyAlert> Add(EmergencyAlert entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.emergency_alert (airport_id, alert_type_id, origin_id, coverage_id, status_id,
            integration_message_id, custom_message_es, custom_message_en, requested_at, requested_by, confirmed_at,
            confirmed_by, started_at, ended_at, ended_by, deploy_duration_ms, restore_duration_ms, pa_triggered, observation,
            created_at, updated_at, created_by, modified_by)
            values (@airport_id, @alert_type_id, @origin_id, @coverage_id, @status_id, @integration_message_id,
            @custom_message_es, @custom_message_en, @requested_at, @requested_by, @confirmed_at, @confirmed_by,
            @started_at, @ended_at, @ended_by, @deploy_duration_ms, @restore_duration_ms, @pa_triggered, @observation,
            @created_at, @updated_at, @created_by, @modified_by) returning id;";
        entity.id = await cnn.QuerySingleAsync<Guid>(query, entity);
        return entity;
    }
    public async Task Update(EmergencyAlert entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.emergency_alert set airport_id = @airport_id, alert_type_id = @alert_type_id,
            origin_id = @origin_id, coverage_id = @coverage_id, status_id = @status_id, integration_message_id = @integration_message_id,
            custom_message_es = @custom_message_es, custom_message_en = @custom_message_en, requested_at = @requested_at,
            requested_by = @requested_by, confirmed_at = @confirmed_at, confirmed_by = @confirmed_by, started_at = @started_at,
            ended_at = @ended_at, ended_by = @ended_by, deploy_duration_ms = @deploy_duration_ms, restore_duration_ms = @restore_duration_ms,
            pa_triggered = @pa_triggered, observation = @observation, updated_at = @updated_at, modified_by = @modified_by where id = @id;";
        await cnn.ExecuteAsync(query, entity);
    }
    public async Task Delete(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync("delete from public.emergency_alert where id = @id", new
        {
            id
        });
    }
}
