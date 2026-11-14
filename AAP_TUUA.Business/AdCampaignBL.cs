using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business;

public class AdCampaignBL
{
    private readonly AdCampaignDao _dao;
    private readonly AdCampaignValidator _validator = new();
    public AdCampaignBL(string cnx)
    {
        _dao = new AdCampaignDao(cnx);
    }
    public Task<List<AdCampaign>> GetAll() => _dao.GetAll();
    public Task<AdCampaign?> GetById(Guid id) => _dao.GetById(id);
    public Task<List<AdCampaign>> GetByAirportId(Guid airportId) => _dao.GetByAirportId(airportId);
    public async Task<AdCampaign> Add(AdCampaign entity, string? userId)
    {
        await Validate(entity);
        entity.created_at = entity.updated_at = DateTime.Now;
        entity.created_by = entity.modified_by = userId;
        entity.is_active = true;
        return await _dao.Add(entity);
    }
    public async Task<AdCampaign> Update(AdCampaign entity, string? userId)
    {
        await Validate(entity);
        if (entity.id is null || entity.id == Guid.Empty)
        {
            throw new Exception("Ad campaign id is required");
        }

        var existing = await _dao.GetById(entity.id.Value) ?? throw new Exception("Ad campaign not found");
        entity.created_at = existing.created_at;
        entity.created_by = existing.created_by;
        entity.updated_at = DateTime.Now;
        entity.modified_by = userId;
        await _dao.Update(entity);
        return entity;
    }
    public async Task Delete(Guid id, string? userId)
    {
        var entity = await _dao.GetById(id) ?? throw new Exception("Ad campaign not found");
        entity.is_active = false;
        await Update(entity, userId);
    }
    private async Task Validate(AdCampaign entity)
    {
        await _validator.ValidateAndThrowAsync(entity);
        entity.start_date = DateTime.SpecifyKind(entity.start_date.Date, DateTimeKind.Unspecified);
        entity.end_date = DateTime.SpecifyKind(entity.end_date.Date, DateTimeKind.Unspecified);
    }
}
