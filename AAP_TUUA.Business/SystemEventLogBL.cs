using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business;

public class SystemEventLogBL
{
    private readonly SystemEventLogDao _dao;
    private readonly SystemEventLogValidator _validator = new();
    public SystemEventLogBL(string cnx)
    {
        _dao = new SystemEventLogDao(cnx);
    }
    public Task<List<SystemEventLog>> GetAll() => _dao.GetAll();
    public Task<SystemEventLog?> GetById(long id) => _dao.GetById(id);
    public Task<List<SystemEventLog>> GetByAirportId(Guid airportId) => _dao.GetByAirportId(airportId);
    public async Task<SystemEventLog> Add(SystemEventLog entity, string? userId)
    {
        await _validator.ValidateAndThrowAsync(entity);
        entity.occurred_at = entity.occurred_at.ToUniversalTime();
        entity.created_at = DateTime.Now;
        entity.created_by = userId;
        return await _dao.Add(entity);
    }
    public async Task<SystemEventLog> Update(SystemEventLog entity, string? userId)
    {
        await _validator.ValidateAndThrowAsync(entity);
        if (entity.id <= 0)
        {
            throw new Exception("System event log id is required");
        }

        var existing = await _dao.GetById(entity.id) ?? throw new Exception("System event log not found");
        entity.occurred_at = entity.occurred_at.ToUniversalTime();
        entity.created_at = existing.created_at;
        entity.created_by = existing.created_by;
        await _dao.Update(entity);
        return entity;
    }
    public async Task Delete(long id, string? userId)
    {
        if (await _dao.GetById(id) is null)
        {
            throw new Exception("System event log not found");
        }

        await _dao.Delete(id);
    }
}
