using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business;

public class FlightImportRowBL
{
    private readonly FlightImportRowDao _dao;
    private readonly FlightImportRowValidator _validator = new();
    public FlightImportRowBL(string cnx)
    {
        _dao = new FlightImportRowDao(cnx);
    }
    public Task<List<FlightImportRow>> GetAll() => _dao.GetAll();
    public Task<FlightImportRow?> GetById(Guid id) => _dao.GetById(id);
    public Task<List<FlightImportRow>> GetByFlightImportBatchId(Guid flightImportBatchId) => _dao.GetByFlightImportBatchId(flightImportBatchId);

    public async Task<FlightImportRow> Add(FlightImportRow entity, string? userId)
    {
        await Validate(entity);
        entity.created_at = entity.updated_at = DateTime.Now;
        entity.created_by = entity.modified_by = userId;
        return await _dao.Add(entity);
    }
    public async Task<FlightImportRow> Update(FlightImportRow entity, string? userId)
    {
        await Validate(entity);
        if (entity.id is null || entity.id == Guid.Empty)
        {
            throw new Exception("Flight import row id is required");
        }

        var existing = await _dao.GetById(entity.id.Value) ?? throw new Exception("Flight import row not found");
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
            throw new Exception("Flight import row not found");
        }

        await _dao.Delete(id);
    }
    private async Task Validate(FlightImportRow entity)
    {
        await _validator.ValidateAndThrowAsync(entity);
        if (entity.flight_date.HasValue)
        {
            entity.flight_date = DateTime.SpecifyKind(entity.flight_date.Value.Date, DateTimeKind.Unspecified);
        }

        if (entity.valid_from.HasValue)
        {
            entity.valid_from = DateTime.SpecifyKind(entity.valid_from.Value.Date, DateTimeKind.Unspecified);
        }

        if (entity.valid_to.HasValue)
        {
            entity.valid_to = DateTime.SpecifyKind(entity.valid_to.Value.Date, DateTimeKind.Unspecified);
        }
    }
}
