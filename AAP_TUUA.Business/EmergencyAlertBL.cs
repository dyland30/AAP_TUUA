using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business;

public class EmergencyAlertBL
{
    private readonly EmergencyAlertDao _dao;
    private readonly EmergencyAlertValidator _validator = new();
    public EmergencyAlertBL(string cnx)
    {
        _dao = new EmergencyAlertDao(cnx);
    }
    public Task<List<EmergencyAlert>> GetAll() => _dao.GetAll();
    public Task<EmergencyAlert?> GetById(Guid id) => _dao.GetById(id);
    public Task<List<EmergencyAlert>> GetByAirportId(Guid airportId) => _dao.GetByAirportId(airportId);
    public async Task<EmergencyAlert> Add(EmergencyAlert entity, string? userId)
    {
        await Validate(entity);
        entity.created_at = entity.updated_at = DateTime.Now;
        entity.created_by = entity.modified_by = userId;
        return await _dao.Add(entity);
    }
    public async Task<EmergencyAlert> Update(EmergencyAlert entity, string? userId)
    {
        await Validate(entity);
        if (entity.id is null || entity.id == Guid.Empty)
        {
            throw new Exception("Emergency alert id is required");
        }

        var existing = await _dao.GetById(entity.id.Value) ?? throw new Exception("Emergency alert not found");
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
            throw new Exception("Emergency alert not found");
        }

        await _dao.Delete(id);
    }
    private async Task Validate(EmergencyAlert entity)
    {
        entity.requested_at = entity.requested_at.ToUniversalTime();
        entity.confirmed_at = entity.confirmed_at?.ToUniversalTime();
        entity.started_at = entity.started_at?.ToUniversalTime();
        entity.ended_at = entity.ended_at?.ToUniversalTime();
        await _validator.ValidateAndThrowAsync(entity);
    }
}
