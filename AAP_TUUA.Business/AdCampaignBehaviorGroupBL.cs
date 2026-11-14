using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business;

public class AdCampaignBehaviorGroupBL
{
    private readonly AdCampaignBehaviorGroupDao _dao;
    private readonly AdCampaignBehaviorGroupValidator _validator = new();
    public AdCampaignBehaviorGroupBL(string cnx)
    {
        _dao = new AdCampaignBehaviorGroupDao(cnx);
    }
    public Task<List<AdCampaignBehaviorGroup>> GetAll() => _dao.GetAll();
    public Task<AdCampaignBehaviorGroup?> GetById(Guid adCampaignId, Guid behaviorGroupId) => _dao.GetById(adCampaignId, behaviorGroupId);
    public Task<List<AdCampaignBehaviorGroup>> GetByAdCampaignId(Guid adCampaignId) => _dao.GetByAdCampaignId(adCampaignId);
    public async Task<AdCampaignBehaviorGroup> Add(AdCampaignBehaviorGroup entity, string? userId)
    {
        await _validator.ValidateAndThrowAsync(entity);
        entity.created_at = entity.updated_at = DateTime.Now;
        entity.created_by = entity.modified_by = userId;
        return await _dao.Add(entity);
    }
    public async Task<AdCampaignBehaviorGroup> Update(AdCampaignBehaviorGroup entity, string? userId)
    {
        await _validator.ValidateAndThrowAsync(entity);
        var existing = await _dao.GetById(entity.ad_campaign_id, entity.behavior_group_id) ?? throw new Exception("Ad campaign behavior group not found");
        entity.created_at = existing.created_at;
        entity.created_by = existing.created_by;
        entity.updated_at = DateTime.Now;
        entity.modified_by = userId;
        await _dao.Update(entity);
        return entity;
    }
    public async Task Delete(Guid adCampaignId, Guid behaviorGroupId, string? userId)
    {
        if (await _dao.GetById(adCampaignId, behaviorGroupId) is null)
        {
            throw new Exception("Ad campaign behavior group not found");
        }

        await _dao.Delete(adCampaignId, behaviorGroupId);
    }
}
