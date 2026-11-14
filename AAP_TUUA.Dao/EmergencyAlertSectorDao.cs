using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class EmergencyAlertSectorDao
{
    private readonly string _cnx;
    public EmergencyAlertSectorDao(string cnx)
    {
        _cnx = cnx;
    }
    public async Task<List<EmergencyAlertSector>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<EmergencyAlertSector>("select * from public.emergency_alert_sector order by emergency_alert_id, airport_sector_id")).ToList();
    }
    public async Task<EmergencyAlertSector?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<EmergencyAlertSector>("select * from public.emergency_alert_sector where id = @id", new
        {
            id
        });
    }
    public async Task<List<EmergencyAlertSector>> GetByEmergencyAlertId(Guid emergencyAlertId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<EmergencyAlertSector>("select * from public.emergency_alert_sector where emergency_alert_id = @emergencyAlertId order by airport_sector_id", new
        {
            emergencyAlertId
        })).ToList();
    }
    public async Task<EmergencyAlertSector> Add(EmergencyAlertSector entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.emergency_alert_sector (emergency_alert_id, airport_sector_id, evacuation_route_id,
            created_at, updated_at, created_by, modified_by) values (@emergency_alert_id, @airport_sector_id, @evacuation_route_id,
            @created_at, @updated_at, @created_by, @modified_by) returning id;";
        entity.id = await cnn.QuerySingleAsync<Guid>(query, entity);
        return entity;
    }
    public async Task Update(EmergencyAlertSector entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync(@"update public.emergency_alert_sector set emergency_alert_id = @emergency_alert_id,
            airport_sector_id = @airport_sector_id, evacuation_route_id = @evacuation_route_id,
            updated_at = @updated_at, modified_by = @modified_by where id = @id;", entity);
    }
    public async Task Delete(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync("delete from public.emergency_alert_sector where id = @id", new
        {
            id
        });
    }
}
