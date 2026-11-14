using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class SystemEventLogDao
{
    private readonly string _cnx;
    public SystemEventLogDao(string cnx)
    {
        _cnx = cnx;
    }
    public async Task<List<SystemEventLog>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<SystemEventLog>("select * from public.system_event_log order by occurred_at desc, id desc")).ToList();
    }
    public async Task<SystemEventLog?> GetById(long id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<SystemEventLog>("select * from public.system_event_log where id = @id", new
        {
            id
        });
    }
    public async Task<List<SystemEventLog>> GetByAirportId(Guid airportId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<SystemEventLog>("select * from public.system_event_log where airport_id = @airportId order by occurred_at desc, id desc", new
        {
            airportId
        })).ToList();
    }
    public async Task<SystemEventLog> Add(SystemEventLog entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.system_event_log (airport_id, level_id, component_id, event_type_id, message,
            details, device_id, integration_channel_id, emergency_alert_id, correlation_id, host_name, occurred_at,
            is_notified, created_at, created_by) values (@airport_id, @level_id, @component_id, @event_type_id, @message,
            cast(@details as jsonb), @device_id, @integration_channel_id, @emergency_alert_id, @correlation_id,
            @host_name, @occurred_at, @is_notified, @created_at, @created_by) returning id;";
        entity.id = await cnn.QuerySingleAsync<long>(query, entity);
        return entity;
    }
    public async Task Update(SystemEventLog entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.system_event_log set airport_id = @airport_id, level_id = @level_id,
            component_id = @component_id, event_type_id = @event_type_id, message = @message, details = cast(@details as jsonb),
            device_id = @device_id, integration_channel_id = @integration_channel_id, emergency_alert_id = @emergency_alert_id,
            correlation_id = @correlation_id, host_name = @host_name, occurred_at = @occurred_at, is_notified = @is_notified where id = @id;";
        await cnn.ExecuteAsync(query, entity);
    }
    public async Task Delete(long id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync("delete from public.system_event_log where id = @id", new
        {
            id
        });
    }
}
