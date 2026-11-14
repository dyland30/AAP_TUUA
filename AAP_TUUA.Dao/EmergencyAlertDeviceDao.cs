using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class EmergencyAlertDeviceDao
{
    private readonly string _cnx;
    public EmergencyAlertDeviceDao(string cnx)
    {
        _cnx = cnx;
    }
    public async Task<List<EmergencyAlertDevice>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<EmergencyAlertDevice>("select * from public.emergency_alert_device order by emergency_alert_id, device_id")).ToList();
    }
    public async Task<EmergencyAlertDevice?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<EmergencyAlertDevice>("select * from public.emergency_alert_device where id = @id", new
        {
            id
        });
    }
    public async Task<List<EmergencyAlertDevice>> GetByEmergencyAlertId(Guid emergencyAlertId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<EmergencyAlertDevice>("select * from public.emergency_alert_device where emergency_alert_id = @emergencyAlertId order by device_id", new
        {
            emergencyAlertId
        })).ToList();
    }
    public async Task<EmergencyAlertDevice> Add(EmergencyAlertDevice entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.emergency_alert_device (emergency_alert_id, device_id, previous_behavior_group_id,
            evacuation_route_id, status_id, sent_at, displayed_at, restored_at, error_message, created_at, updated_at, created_by, modified_by)
            values (@emergency_alert_id, @device_id, @previous_behavior_group_id, @evacuation_route_id, @status_id,
            @sent_at, @displayed_at, @restored_at, @error_message, @created_at, @updated_at, @created_by, @modified_by) returning id;";
        entity.id = await cnn.QuerySingleAsync<Guid>(query, entity);
        return entity;
    }
    public async Task Update(EmergencyAlertDevice entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.emergency_alert_device set emergency_alert_id = @emergency_alert_id, device_id = @device_id,
            previous_behavior_group_id = @previous_behavior_group_id, evacuation_route_id = @evacuation_route_id,
            status_id = @status_id, sent_at = @sent_at, displayed_at = @displayed_at, restored_at = @restored_at,
            error_message = @error_message, updated_at = @updated_at, modified_by = @modified_by where id = @id;";
        await cnn.ExecuteAsync(query, entity);
    }
    public async Task Delete(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync("delete from public.emergency_alert_device where id = @id", new
        {
            id
        });
    }
}
