using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class EmergencyAlertDisplayRuleDao
{
    private readonly string _cnx;
    public EmergencyAlertDisplayRuleDao(string cnx)
    {
        _cnx = cnx;
    }
    public async Task<List<EmergencyAlertDisplayRule>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<EmergencyAlertDisplayRule>("select * from public.emergency_alert_display_rule order by alert_type_id, display_type_id")).ToList();
    }
    public async Task<EmergencyAlertDisplayRule?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<EmergencyAlertDisplayRule>("select * from public.emergency_alert_display_rule where id = @id", new
        {
            id
        });
    }
    public async Task<List<EmergencyAlertDisplayRule>> GetByAlertTypeId(int alertTypeId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<EmergencyAlertDisplayRule>("select * from public.emergency_alert_display_rule where alert_type_id = @alertTypeId order by display_type_id", new
        {
            alertTypeId
        })).ToList();
    }
    public async Task<EmergencyAlertDisplayRule> Add(EmergencyAlertDisplayRule entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.emergency_alert_display_rule (alert_type_id, display_type_id, is_active, created_at, updated_at, created_by, modified_by)
            values (@alert_type_id, @display_type_id, @is_active, @created_at, @updated_at, @created_by, @modified_by) returning id;";
        entity.id = await cnn.QuerySingleAsync<Guid>(query, entity);
        return entity;
    }
    public async Task Update(EmergencyAlertDisplayRule entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync(@"update public.emergency_alert_display_rule set alert_type_id = @alert_type_id, display_type_id = @display_type_id,
            is_active = @is_active, updated_at = @updated_at, modified_by = @modified_by where id = @id;", entity);
    }
}
