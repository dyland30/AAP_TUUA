using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class DeviceIncidentDao
{
    private readonly string _cnx;
    public DeviceIncidentDao(string cnx)
    {
        _cnx = cnx;
    }
    public async Task<List<DeviceIncident>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<DeviceIncident>("select * from public.device_incident order by detected_at desc, id desc")).ToList();
    }
    public async Task<DeviceIncident?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<DeviceIncident>("select * from public.device_incident where id = @id", new
        {
            id
        });
    }
    public async Task<List<DeviceIncident>> GetByDeviceId(Guid deviceId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<DeviceIncident>("select * from public.device_incident where device_id = @deviceId order by detected_at desc, id desc", new
        {
            deviceId
        })).ToList();
    }
    public async Task<DeviceIncident> Add(DeviceIncident entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.device_incident (device_id, incident_type_id, detected_at, acknowledged_at,
            acknowledged_by, resolved_at, resolved_by, error_count, is_escalated, escalated_at, system_event_log_id,
            notes, is_active, created_at, updated_at, created_by, modified_by)
            values (@device_id, @incident_type_id, @detected_at, @acknowledged_at, @acknowledged_by, @resolved_at,
            @resolved_by, @error_count, @is_escalated, @escalated_at, @system_event_log_id, @notes, @is_active,
            @created_at, @updated_at, @created_by, @modified_by) returning id;";
        entity.id = await cnn.QuerySingleAsync<Guid>(query, entity);
        return entity;
    }
    public async Task Update(DeviceIncident entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.device_incident set device_id = @device_id, incident_type_id = @incident_type_id,
            detected_at = @detected_at, acknowledged_at = @acknowledged_at, acknowledged_by = @acknowledged_by,
            resolved_at = @resolved_at, resolved_by = @resolved_by, error_count = @error_count, is_escalated = @is_escalated,
            escalated_at = @escalated_at, system_event_log_id = @system_event_log_id, notes = @notes, is_active = @is_active,
            updated_at = @updated_at, modified_by = @modified_by where id = @id;";
        await cnn.ExecuteAsync(query, entity);
    }
}
