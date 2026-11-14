using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business;

public class FlightStatusTransitionBL
{
    private readonly FlightStatusTransitionDao _dao;
    private readonly FlightStatusTransitionValidator _validator = new();
    public FlightStatusTransitionBL(string cnx)
    {
        _dao = new FlightStatusTransitionDao(cnx);
    }
    public Task<List<FlightStatusTransition>> GetAll() => _dao.GetAll();
    public Task<FlightStatusTransition?> GetById(Guid id) => _dao.GetById(id);
    public Task<List<FlightStatusTransition>> GetByFromStatusId(int fromStatusId) => _dao.GetByFromStatusId(fromStatusId);

    public async Task<FlightStatusTransition> Add(FlightStatusTransition entity, string? userId)
    {
        await _validator.ValidateAndThrowAsync(entity);
        entity.created_at = entity.updated_at = DateTime.Now;
        entity.created_by = entity.modified_by = userId;
        entity.is_active = true;
        return await _dao.Add(entity);
    }

    public async Task<FlightStatusTransition> Update(FlightStatusTransition entity, string? userId)
    {
        await _validator.ValidateAndThrowAsync(entity);
        if (entity.id is null || entity.id == Guid.Empty)
        {
            throw new Exception("Flight status transition id is required");
        }

        var existing = await _dao.GetById(entity.id.Value) ?? throw new Exception("Flight status transition not found");
        entity.created_at = existing.created_at;
        entity.created_by = existing.created_by;
        entity.updated_at = DateTime.Now;
        entity.modified_by = userId;
        await _dao.Update(entity);
        return entity;
    }

    public async Task Delete(Guid id, string? userId)
    {
        var entity = await _dao.GetById(id) ?? throw new Exception("Flight status transition not found");
        entity.is_active = false;
        await Update(entity, userId);
    }
}
