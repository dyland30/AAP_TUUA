using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business;

public class FlightChangeHistoryBL
{
    private readonly FlightChangeHistoryDao _dao;
    private readonly FlightChangeHistoryValidator _validator = new();
    public FlightChangeHistoryBL(string cnx)
    {
        _dao = new FlightChangeHistoryDao(cnx);
    }
    public Task<List<FlightChangeHistory>> GetAll() => _dao.GetAll();
    public Task<FlightChangeHistory?> GetById(Guid id) => _dao.GetById(id);
    public Task<List<FlightChangeHistory>> GetByFlightId(Guid flightId) => _dao.GetByFlightId(flightId);

    public async Task<FlightChangeHistory> Add(FlightChangeHistory entity, string? userId)
    {
        await _validator.ValidateAndThrowAsync(entity);
        entity.changed_at = entity.changed_at.ToUniversalTime();
        entity.created_at = entity.updated_at = DateTime.Now;
        entity.created_by = entity.modified_by = userId;
        return await _dao.Add(entity);
    }
}
