using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class AdCampaignItemDao
{
    private readonly string _cnx;
    public AdCampaignItemDao(string cnx)
    {
        _cnx = cnx;
    }
    public async Task<List<AdCampaignItem>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<AdCampaignItem>("select * from public.ad_campaign_item order by ad_campaign_id, sort_order, id")).ToList();
    }
    public async Task<AdCampaignItem?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<AdCampaignItem>("select * from public.ad_campaign_item where id = @id", new
        {
            id
        });
    }
    public async Task<List<AdCampaignItem>> GetByAdCampaignId(Guid adCampaignId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<AdCampaignItem>("select * from public.ad_campaign_item where ad_campaign_id = @adCampaignId order by sort_order, id", new
        {
            adCampaignId
        })).ToList();
    }
    public async Task<AdCampaignItem> Add(AdCampaignItem entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.ad_campaign_item (ad_campaign_id, media_asset_id, sort_order, duration_seconds,
            is_active, created_at, updated_at, created_by, modified_by) values (@ad_campaign_id, @media_asset_id, @sort_order,
            @duration_seconds, @is_active, @created_at, @updated_at, @created_by, @modified_by) returning id;";
        entity.id = await cnn.QuerySingleAsync<Guid>(query, entity);
        return entity;
    }
    public async Task Update(AdCampaignItem entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.ad_campaign_item set ad_campaign_id = @ad_campaign_id, media_asset_id = @media_asset_id,
            sort_order = @sort_order, duration_seconds = @duration_seconds, is_active = @is_active,
            updated_at = @updated_at, modified_by = @modified_by where id = @id;";
        await cnn.ExecuteAsync(query, entity);
    }
}
