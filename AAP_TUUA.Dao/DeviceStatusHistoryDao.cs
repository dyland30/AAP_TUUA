using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class DeviceStatusHistoryDao
{
    private readonly string _cnx;
    public DeviceStatusHistoryDao(string cnx)
    {
        _cnx = cnx;
    }
    public async Task<List<DeviceStatusHistory>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<DeviceStatusHistory>("select * from public.device_status_history order by started_at desc, id desc")).ToList();
    }
    public async Task<DeviceStatusHistory?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<DeviceStatusHistory>("select * from public.device_status_history where id = @id", new
        {
            id
        });
    }
    public async Task<List<DeviceStatusHistory>> GetByDeviceId(Guid deviceId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<DeviceStatusHistory>("select * from public.device_status_history where device_id = @deviceId order by started_at desc, id desc", new
        {
            deviceId
        })).ToList();
    }
}
