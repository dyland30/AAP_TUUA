using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business;

public class LocalUserAirlineBL
{
    private readonly LocalUserAirlineDao _dao;
    private readonly LocalUserAirlineValidator _validator = new();
    public LocalUserAirlineBL(string cnx)
    {
        _dao = new LocalUserAirlineDao(cnx);
    }
    public Task<List<LocalUserAirline>> GetAll() => _dao.GetAll();
    public Task<LocalUserAirline?> GetById(Guid localUserId, Guid airlineId) => _dao.GetById(localUserId, airlineId);
    public Task<List<LocalUserAirline>> GetByLocalUserId(Guid localUserId) => _dao.GetByLocalUserId(localUserId);
    public async Task<LocalUserAirline> Add(LocalUserAirline entity, string? userId)
    {
        await _validator.ValidateAndThrowAsync(entity);
        entity.created_at = entity.updated_at = DateTime.Now;
        entity.created_by = entity.modified_by = userId;
        entity.is_active = true;
        return await _dao.Add(entity);
    }
    public async Task<LocalUserAirline> Update(LocalUserAirline entity, string? userId)
    {
        await _validator.ValidateAndThrowAsync(entity);
        var existing = await _dao.GetById(entity.local_user_id, entity.airline_id) ?? throw new Exception("Local user airline not found");
        entity.created_at = existing.created_at;
        entity.created_by = existing.created_by;
        entity.updated_at = DateTime.Now;
        entity.modified_by = userId;
        await _dao.Update(entity);
        return entity;
    }
    public async Task Delete(Guid localUserId, Guid airlineId, string? userId)
    {
        var entity = await _dao.GetById(localUserId, airlineId) ?? throw new Exception("Local user airline not found");
        entity.is_active = false;
        await Update(entity, userId);
    }
}
