using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business;

public class DeviceIncidentBL
{
    private readonly DeviceIncidentDao _dao;
    private readonly DeviceIncidentValidator _validator = new();
    public DeviceIncidentBL(string cnx)
    {
        _dao = new DeviceIncidentDao(cnx);
    }
    public Task<List<DeviceIncident>> GetAll() => _dao.GetAll();
    public Task<DeviceIncident?> GetById(Guid id) => _dao.GetById(id);
    public Task<List<DeviceIncident>> GetByDeviceId(Guid deviceId) => _dao.GetByDeviceId(deviceId);
    public async Task<DeviceIncident> Add(DeviceIncident entity, string? userId)
    {
        await Validate(entity);
        entity.created_at = entity.updated_at = DateTime.Now;
        entity.created_by = entity.modified_by = userId;
        entity.is_active = true;
        return await _dao.Add(entity);
    }
    public async Task<DeviceIncident> Update(DeviceIncident entity, string? userId)
    {
        await Validate(entity);
        if (entity.id is null || entity.id == Guid.Empty)
        {
            throw new Exception("Device incident id is required");
        }

        var existing = await _dao.GetById(entity.id.Value) ?? throw new Exception("Device incident not found");
        entity.created_at = existing.created_at;
        entity.created_by = existing.created_by;
        entity.updated_at = DateTime.Now;
        entity.modified_by = userId;
        await _dao.Update(entity);
        return entity;
    }
    public async Task Delete(Guid id, string? userId)
    {
        var entity = await _dao.GetById(id) ?? throw new Exception("Device incident not found");
        entity.is_active = false;
        await Update(entity, userId);
    }
    private async Task Validate(DeviceIncident entity)
    {
        await _validator.ValidateAndThrowAsync(entity);
        entity.detected_at = entity.detected_at.ToUniversalTime();
        entity.acknowledged_at = entity.acknowledged_at?.ToUniversalTime();
        entity.resolved_at = entity.resolved_at?.ToUniversalTime();
        entity.escalated_at = entity.escalated_at?.ToUniversalTime();
    }
}
