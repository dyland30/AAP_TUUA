using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class DeviceStatusHistoryBL
{
    private readonly DeviceStatusHistoryDao _dao;
    public DeviceStatusHistoryBL(string cnx)
    {
        _dao = new DeviceStatusHistoryDao(cnx);
    }
    public Task<List<DeviceStatusHistory>> GetAll() => _dao.GetAll();
    public Task<DeviceStatusHistory?> GetById(Guid id) => _dao.GetById(id);
    public Task<List<DeviceStatusHistory>> GetByDeviceId(Guid deviceId) => _dao.GetByDeviceId(deviceId);
}
