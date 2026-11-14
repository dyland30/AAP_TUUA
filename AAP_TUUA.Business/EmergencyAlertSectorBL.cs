using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business;

public class EmergencyAlertSectorBL
{
    private readonly EmergencyAlertSectorDao _dao;
    private readonly EmergencyAlertSectorValidator _validator = new();
    public EmergencyAlertSectorBL(string cnx)
    {
        _dao = new EmergencyAlertSectorDao(cnx);
    }
    public Task<List<EmergencyAlertSector>> GetAll() => _dao.GetAll();
    public Task<EmergencyAlertSector?> GetById(Guid id) => _dao.GetById(id);
    public Task<List<EmergencyAlertSector>> GetByEmergencyAlertId(Guid emergencyAlertId) => _dao.GetByEmergencyAlertId(emergencyAlertId);
    public async Task<EmergencyAlertSector> Add(EmergencyAlertSector entity, string? userId)
    {
        await _validator.ValidateAndThrowAsync(entity);
        entity.created_at = entity.updated_at = DateTime.Now;
        entity.created_by = entity.modified_by = userId;
        return await _dao.Add(entity);
    }
    public async Task<EmergencyAlertSector> Update(EmergencyAlertSector entity, string? userId)
    {
        await _validator.ValidateAndThrowAsync(entity);
        if (entity.id is null || entity.id == Guid.Empty)
        {
            throw new Exception("Emergency alert sector id is required");
        }

        var existing = await _dao.GetById(entity.id.Value) ?? throw new Exception("Emergency alert sector not found");
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
            throw new Exception("Emergency alert sector not found");
        }

        await _dao.Delete(id);
    }
}
