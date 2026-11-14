using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business;

public class AdCampaignItemBL
{
    private readonly AdCampaignItemDao _dao;
    private readonly AdCampaignItemValidator _validator = new();
    public AdCampaignItemBL(string cnx)
    {
        _dao = new AdCampaignItemDao(cnx);
    }
    public Task<List<AdCampaignItem>> GetAll() => _dao.GetAll();
    public Task<AdCampaignItem?> GetById(Guid id) => _dao.GetById(id);
    public Task<List<AdCampaignItem>> GetByAdCampaignId(Guid adCampaignId) => _dao.GetByAdCampaignId(adCampaignId);
    public async Task<AdCampaignItem> Add(AdCampaignItem entity, string? userId)
    {
        await _validator.ValidateAndThrowAsync(entity);
        entity.created_at = entity.updated_at = DateTime.Now;
        entity.created_by = entity.modified_by = userId;
        entity.is_active = true;
        return await _dao.Add(entity);
    }
    public async Task<AdCampaignItem> Update(AdCampaignItem entity, string? userId)
    {
        await _validator.ValidateAndThrowAsync(entity);
        if (entity.id is null || entity.id == Guid.Empty)
        {
            throw new Exception("Ad campaign item id is required");
        }

        var existing = await _dao.GetById(entity.id.Value) ?? throw new Exception("Ad campaign item not found");
        entity.created_at = existing.created_at;
        entity.created_by = existing.created_by;
        entity.updated_at = DateTime.Now;
        entity.modified_by = userId;
        await _dao.Update(entity);
        return entity;
    }
    public async Task Delete(Guid id, string? userId)
    {
        var entity = await _dao.GetById(id) ?? throw new Exception("Ad campaign item not found");
        entity.is_active = false;
        await Update(entity, userId);
    }
}
