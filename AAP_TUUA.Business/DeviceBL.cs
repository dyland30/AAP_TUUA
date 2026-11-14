using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business;

public class DeviceBL
{
    private readonly DeviceDao _dao;
    private readonly DeviceValidator _validator = new();
    public DeviceBL(string cnx)
    {
        _dao = new DeviceDao(cnx);
    }
    public Task<List<Device>> GetAll() => _dao.GetAll();
    public Task<Device?> GetById(Guid id) => _dao.GetById(id);
    public Task<List<Device>> GetByAirportId(Guid airportId) => _dao.GetByAirportId(airportId);
    public async Task<Device> Add(Device entity, string? userId)
    {
        await Validate(entity);
        entity.created_at = entity.updated_at = DateTime.Now;
        entity.created_by = entity.modified_by = userId;
        entity.is_active = true;
        return await _dao.Add(entity);
    }
    public async Task<Device> Update(Device entity, string? userId)
    {
        await Validate(entity);
        if (entity.id is null || entity.id == Guid.Empty)
        {
            throw new Exception("Device id is required");
        }

        var existing = await _dao.GetById(entity.id.Value) ?? throw new Exception("Device not found");
        entity.created_at = existing.created_at;
        entity.created_by = existing.created_by;
        entity.updated_at = DateTime.Now;
        entity.modified_by = userId;
        await _dao.Update(entity);
        return entity;
    }
    public async Task Delete(Guid id, string? userId)
    {
        var entity = await _dao.GetById(id) ?? throw new Exception("Device not found");
        entity.is_active = false;
        await Update(entity, userId);
    }
    private async Task Validate(Device entity)
    {
        await _validator.ValidateAndThrowAsync(entity);
        entity.last_heartbeat_at = entity.last_heartbeat_at?.ToUniversalTime();
        entity.last_status_change_at = entity.last_status_change_at?.ToUniversalTime();
        entity.last_ntp_sync_at = entity.last_ntp_sync_at?.ToUniversalTime();
    }
}
