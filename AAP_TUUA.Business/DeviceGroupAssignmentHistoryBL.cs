using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class DeviceGroupAssignmentHistoryBL
{
    private readonly DeviceGroupAssignmentHistoryDao _dao;
    public DeviceGroupAssignmentHistoryBL(string cnx)
    {
        _dao = new DeviceGroupAssignmentHistoryDao(cnx);
    }
    public Task<List<DeviceGroupAssignmentHistory>> GetAll() => _dao.GetAll();
    public Task<DeviceGroupAssignmentHistory?> GetById(Guid id) => _dao.GetById(id);
    public Task<List<DeviceGroupAssignmentHistory>> GetByDeviceId(Guid deviceId) => _dao.GetByDeviceId(deviceId);
}
