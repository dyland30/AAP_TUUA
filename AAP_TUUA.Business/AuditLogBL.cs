using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business;

public class AuditLogBL
{
    private readonly AuditLogDao _dao;
    private readonly AuditLogValidator _validator = new();
    public AuditLogBL(string cnx)
    {
        _dao = new AuditLogDao(cnx);
    }
    public Task<List<AuditLog>> GetAll() => _dao.GetAll();
    public Task<AuditLog?> GetById(long id) => _dao.GetById(id);
    public Task<List<AuditLog>> GetByAirportId(Guid airportId) => _dao.GetByAirportId(airportId);
    public async Task<AuditLog> Add(AuditLog entity, string? userId)
    {
        await _validator.ValidateAndThrowAsync(entity);
        entity.occurred_at = entity.occurred_at.ToUniversalTime();
        entity.created_at = DateTime.Now;
        entity.created_by = userId;
        return await _dao.Add(entity);
    }
}
