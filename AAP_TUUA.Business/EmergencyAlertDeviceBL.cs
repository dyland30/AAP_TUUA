using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business;

public class EmergencyAlertDeviceBL
{
    private readonly EmergencyAlertDeviceDao _dao;
    private readonly EmergencyAlertDeviceValidator _validator = new();
    public EmergencyAlertDeviceBL(string cnx)
    {
        _dao = new EmergencyAlertDeviceDao(cnx);
    }
    public Task<List<EmergencyAlertDevice>> GetAll() => _dao.GetAll();
    public Task<EmergencyAlertDevice?> GetById(Guid id) => _dao.GetById(id);
    public Task<List<EmergencyAlertDevice>> GetByEmergencyAlertId(Guid emergencyAlertId) => _dao.GetByEmergencyAlertId(emergencyAlertId);
    public async Task<EmergencyAlertDevice> Add(EmergencyAlertDevice entity, string? userId)
    {
        await Validate(entity);
        entity.created_at = entity.updated_at = DateTime.Now;
        entity.created_by = entity.modified_by = userId;
        return await _dao.Add(entity);
    }
    public async Task<EmergencyAlertDevice> Update(EmergencyAlertDevice entity, string? userId)
    {
        await Validate(entity);
        if (entity.id is null || entity.id == Guid.Empty)
        {
            throw new Exception("Emergency alert device id is required");
        }

        var existing = await _dao.GetById(entity.id.Value) ?? throw new Exception("Emergency alert device not found");
        entity.created_at = existing.created_at;
        entity.created_by = existing.created_by;
        entity.updated_at = DateTime.Now;
        entity.modified_by = userId;
        await _dao.Update(entity);
        return entity;
    }
    public async Task Delete(Guid id, string? userId)
    {
        if (await _dao.GetById(id) is null)
        {
            throw new Exception("Emergency alert device not found");
        }

        await _dao.Delete(id);
    }
    private async Task Validate(EmergencyAlertDevice entity)
    {
        await _validator.ValidateAndThrowAsync(entity);
        entity.sent_at = entity.sent_at?.ToUniversalTime();
        entity.displayed_at = entity.displayed_at?.ToUniversalTime();
        entity.restored_at = entity.restored_at?.ToUniversalTime();
    }
}
