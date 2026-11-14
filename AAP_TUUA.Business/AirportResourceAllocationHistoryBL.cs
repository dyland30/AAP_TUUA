using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business;

public class AirportResourceAllocationHistoryBL
{
    private readonly AirportResourceAllocationHistoryDao _dao;
    private readonly AirportResourceAllocationHistoryValidator _validator = new();
    public AirportResourceAllocationHistoryBL(string cnx)
    {
        _dao = new AirportResourceAllocationHistoryDao(cnx);
    }
    public Task<List<AirportResourceAllocationHistory>> GetAll() => _dao.GetAll();
    public Task<AirportResourceAllocationHistory?> GetById(Guid id) => _dao.GetById(id);
    public Task<List<AirportResourceAllocationHistory>> GetByAirportResourceAllocationId(Guid airportResourceAllocationId) => _dao.GetByAirportResourceAllocationId(airportResourceAllocationId);

    public async Task<AirportResourceAllocationHistory> Add(AirportResourceAllocationHistory entity, string? userId)
    {
        await _validator.ValidateAndThrowAsync(entity);
        entity.action_at = entity.action_at.ToUniversalTime();
        entity.created_at = entity.updated_at = DateTime.Now;
        entity.created_by = entity.modified_by = userId;
        return await _dao.Add(entity);
    }
}
