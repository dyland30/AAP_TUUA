using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business;

public class FlightImportBatchBL
{
    private readonly FlightImportBatchDao _dao;
    private readonly FlightImportBatchValidator _validator = new();
    public FlightImportBatchBL(string cnx)
    {
        _dao = new FlightImportBatchDao(cnx);
    }
    public Task<List<FlightImportBatch>> GetAll() => _dao.GetAll();
    public Task<FlightImportBatch?> GetById(Guid id) => _dao.GetById(id);
    public Task<List<FlightImportBatch>> GetByAirportId(Guid airportId) => _dao.GetByAirportId(airportId);

    public async Task<FlightImportBatch> Add(FlightImportBatch entity, string? userId)
    {
        await Validate(entity);
        entity.created_at = entity.updated_at = DateTime.Now;
        entity.created_by = entity.modified_by = userId;
        entity.is_active = true;
        return await _dao.Add(entity);
    }
    public async Task<FlightImportBatch> Update(FlightImportBatch entity, string? userId)
    {
        await Validate(entity);
        if (entity.id is null || entity.id == Guid.Empty)
        {
            throw new Exception("Flight import batch id is required");
        }

        var existing = await _dao.GetById(entity.id.Value) ?? throw new Exception("Flight import batch not found");
        entity.created_at = existing.created_at;
        entity.created_by = existing.created_by;
        entity.updated_at = DateTime.Now;
        entity.modified_by = userId;
        await _dao.Update(entity);
        return entity;
    }
    public async Task Delete(Guid id, string? userId)
    {
        var entity = await _dao.GetById(id) ?? throw new Exception("Flight import batch not found");
        entity.is_active = false;
        await Update(entity, userId);
    }
    private async Task Validate(FlightImportBatch entity)
    {
        await _validator.ValidateAndThrowAsync(entity);
        entity.validated_at = entity.validated_at?.ToUniversalTime();
        entity.confirmed_at = entity.confirmed_at?.ToUniversalTime();
        if (entity.date_from.HasValue)
        {
            entity.date_from = DateTime.SpecifyKind(entity.date_from.Value.Date, DateTimeKind.Unspecified);
        }

        if (entity.date_to.HasValue)
        {
            entity.date_to = DateTime.SpecifyKind(entity.date_to.Value.Date, DateTimeKind.Unspecified);
        }
    }
}
