using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business;

public class EvacuationRouteBL
{
    private readonly EvacuationRouteDao _dao;
    private readonly EvacuationRouteValidator _validator = new();
    public EvacuationRouteBL(string cnx)
    {
        _dao = new EvacuationRouteDao(cnx);
    }
    public Task<List<EvacuationRoute>> GetAll() => _dao.GetAll();
    public Task<EvacuationRoute?> GetById(Guid id) => _dao.GetById(id);
    public Task<List<EvacuationRoute>> GetByAirportSectorId(Guid airportSectorId) => _dao.GetByAirportSectorId(airportSectorId);

    public async Task<EvacuationRoute> Add(EvacuationRoute entity, string? userId)
    {
        await _validator.ValidateAndThrowAsync(entity);
        entity.created_at = entity.updated_at = DateTime.Now;
        entity.created_by = entity.modified_by = userId;
        entity.is_active = true;
        return await _dao.Add(entity);
    }
    public async Task<EvacuationRoute> Update(EvacuationRoute entity, string? userId)
    {
        await _validator.ValidateAndThrowAsync(entity);
        if (entity.id is null || entity.id == Guid.Empty)
        {
            throw new Exception("Evacuation route id is required");
        }

        var existing = await _dao.GetById(entity.id.Value) ?? throw new Exception("Evacuation route not found");
        entity.created_at = existing.created_at;
        entity.created_by = existing.created_by;
        entity.updated_at = DateTime.Now;
        entity.modified_by = userId;
        await _dao.Update(entity);
        return entity;
    }
    public async Task Delete(Guid id, string? userId)
    {
        var entity = await _dao.GetById(id) ?? throw new Exception("Evacuation route not found");
        entity.is_active = false;
        await Update(entity, userId);
    }
}
