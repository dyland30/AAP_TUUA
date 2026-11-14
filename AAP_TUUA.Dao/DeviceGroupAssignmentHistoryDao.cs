using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class DeviceGroupAssignmentHistoryDao
{
    private readonly string _cnx;
    public DeviceGroupAssignmentHistoryDao(string cnx)
    {
        _cnx = cnx;
    }
    public async Task<List<DeviceGroupAssignmentHistory>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<DeviceGroupAssignmentHistory>("select * from public.device_group_assignment_history order by assigned_at desc, id desc")).ToList();
    }
    public async Task<DeviceGroupAssignmentHistory?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<DeviceGroupAssignmentHistory>("select * from public.device_group_assignment_history where id = @id", new
        {
            id
        });
    }
    public async Task<List<DeviceGroupAssignmentHistory>> GetByDeviceId(Guid deviceId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<DeviceGroupAssignmentHistory>("select * from public.device_group_assignment_history where device_id = @deviceId order by assigned_at desc, id desc", new
        {
            deviceId
        })).ToList();
    }
}
