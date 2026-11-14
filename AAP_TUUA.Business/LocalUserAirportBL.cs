using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business;

public class LocalUserAirportBL
{
    private readonly LocalUserAirportDao _dao;
    private readonly LocalUserAirportValidator _validator = new();
    public LocalUserAirportBL(string cnx)
    {
        _dao = new LocalUserAirportDao(cnx);
    }
    public Task<List<LocalUserAirport>> GetAll() => _dao.GetAll();
    public Task<LocalUserAirport?> GetById(Guid localUserId, Guid airportId) => _dao.GetById(localUserId, airportId);
    public Task<List<LocalUserAirport>> GetByLocalUserId(Guid localUserId) => _dao.GetByLocalUserId(localUserId);
    public async Task<LocalUserAirport> Add(LocalUserAirport entity, string? userId)
    {
        await _validator.ValidateAndThrowAsync(entity);
        entity.created_at = entity.updated_at = DateTime.Now;
        entity.created_by = entity.modified_by = userId;
        entity.is_active = true;
        return await _dao.Add(entity);
    }
    public async Task<LocalUserAirport> Update(LocalUserAirport entity, string? userId)
    {
        await _validator.ValidateAndThrowAsync(entity);
        var existing = await _dao.GetById(entity.local_user_id, entity.airport_id) ?? throw new Exception("Local user airport not found");
        entity.created_at = existing.created_at;
        entity.created_by = existing.created_by;
        entity.updated_at = DateTime.Now;
        entity.modified_by = userId;
        await _dao.Update(entity);
        return entity;
    }
    public async Task Delete(Guid localUserId, Guid airportId, string? userId)
    {
        var entity = await _dao.GetById(localUserId, airportId) ?? throw new Exception("Local user airport not found");
        entity.is_active = false;
        await Update(entity, userId);
    }
}
