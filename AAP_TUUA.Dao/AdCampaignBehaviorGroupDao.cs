using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class AdCampaignBehaviorGroupDao
{
    private readonly string _cnx;
    public AdCampaignBehaviorGroupDao(string cnx)
    {
        _cnx = cnx;
    }
    public async Task<List<AdCampaignBehaviorGroup>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<AdCampaignBehaviorGroup>("select * from public.ad_campaign_behavior_group order by ad_campaign_id, behavior_group_id")).ToList();
    }
    public async Task<AdCampaignBehaviorGroup?> GetById(Guid adCampaignId, Guid behaviorGroupId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<AdCampaignBehaviorGroup>("select * from public.ad_campaign_behavior_group where ad_campaign_id = @adCampaignId and behavior_group_id = @behaviorGroupId", new
        {
            adCampaignId,
            behaviorGroupId
        });
    }
    public async Task<List<AdCampaignBehaviorGroup>> GetByAdCampaignId(Guid adCampaignId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<AdCampaignBehaviorGroup>("select * from public.ad_campaign_behavior_group where ad_campaign_id = @adCampaignId order by behavior_group_id", new
        {
            adCampaignId
        })).ToList();
    }
    public async Task<AdCampaignBehaviorGroup> Add(AdCampaignBehaviorGroup entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.ad_campaign_behavior_group (ad_campaign_id, behavior_group_id, created_at, updated_at, created_by, modified_by)
            values (@ad_campaign_id, @behavior_group_id, @created_at, @updated_at, @created_by, @modified_by);";
        await cnn.ExecuteAsync(query, entity);
        return entity;
    }
    public async Task Update(AdCampaignBehaviorGroup entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync(@"update public.ad_campaign_behavior_group set updated_at = @updated_at, modified_by = @modified_by
            where ad_campaign_id = @ad_campaign_id and behavior_group_id = @behavior_group_id;", entity);
    }
    public async Task Delete(Guid adCampaignId, Guid behaviorGroupId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync("delete from public.ad_campaign_behavior_group where ad_campaign_id = @adCampaignId and behavior_group_id = @behaviorGroupId", new
        {
            adCampaignId,
            behaviorGroupId
        });
    }
}
