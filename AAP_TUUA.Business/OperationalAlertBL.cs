using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business;

public class OperationalAlertBL
{
    private readonly OperationalAlertDao _dao;
    private readonly OperationalAlertValidator _validator = new();
    public OperationalAlertBL(string cnx)
    {
        _dao = new OperationalAlertDao(cnx);
    }
    public Task<List<OperationalAlert>> GetAll() => _dao.GetAll();
    public Task<OperationalAlert?> GetById(Guid id) => _dao.GetById(id);
    public Task<List<OperationalAlert>> GetByFlightId(Guid flightId) => _dao.GetByFlightId(flightId);
    public async Task<OperationalAlert> Add(OperationalAlert entity, string? userId)
    {
        await Validate(entity);
        entity.created_at = entity.updated_at = DateTime.Now;
        entity.created_by = entity.modified_by = userId;
        entity.is_active = true;
        return await _dao.Add(entity);
    }
    public async Task<OperationalAlert> Update(OperationalAlert entity, string? userId)
    {
        await Validate(entity);
        if (entity.id is null || entity.id == Guid.Empty)
        {
            throw new Exception("Operational alert id is required");
        }

        var existing = await _dao.GetById(entity.id.Value) ?? throw new Exception("Operational alert not found");
        entity.created_at = existing.created_at;
        entity.created_by = existing.created_by;
        entity.updated_at = DateTime.Now;
        entity.modified_by = userId;
        await _dao.Update(entity);
        return entity;
    }
    public async Task Delete(Guid id, string? userId)
    {
        var entity = await _dao.GetById(id) ?? throw new Exception("Operational alert not found");
        entity.is_active = false;
        await Update(entity, userId);
    }
    private async Task Validate(OperationalAlert entity)
    {
        await _validator.ValidateAndThrowAsync(entity);
        entity.detected_at = entity.detected_at.ToUniversalTime();
        entity.acknowledged_at = entity.acknowledged_at?.ToUniversalTime();
        entity.propagated_at = entity.propagated_at?.ToUniversalTime();
    }
}
