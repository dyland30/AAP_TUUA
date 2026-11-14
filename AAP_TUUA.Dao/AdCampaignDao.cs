using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class AdCampaignDao
{
    private readonly string _cnx;
    public AdCampaignDao(string cnx)
    {
        _cnx = cnx;
    }
    public async Task<List<AdCampaign>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<AdCampaign>("select * from public.ad_campaign order by start_date desc, name")).ToList();
    }
    public async Task<AdCampaign?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<AdCampaign>("select * from public.ad_campaign where id = @id", new
        {
            id
        });
    }
    public async Task<List<AdCampaign>> GetByAirportId(Guid airportId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<AdCampaign>("select * from public.ad_campaign where airport_id = @airportId order by start_date desc, name", new
        {
            airportId
        })).ToList();
    }
    public async Task<AdCampaign> Add(AdCampaign entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.ad_campaign (airport_id, company_id, name, description, start_date, end_date,
            daily_start_time, daily_end_time, days_of_week, priority_id, status_id, is_active, created_at, updated_at, created_by, modified_by)
            values (@airport_id, @company_id, @name, @description, cast(@start_date as date), cast(@end_date as date),
            @daily_start_time, @daily_end_time, @days_of_week, @priority_id, @status_id, @is_active,
            @created_at, @updated_at, @created_by, @modified_by) returning id;";
        entity.id = await cnn.QuerySingleAsync<Guid>(query, entity);
        return entity;
    }
    public async Task Update(AdCampaign entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.ad_campaign set airport_id = @airport_id, company_id = @company_id, name = @name,
            description = @description, start_date = cast(@start_date as date), end_date = cast(@end_date as date),
            daily_start_time = @daily_start_time, daily_end_time = @daily_end_time, days_of_week = @days_of_week,
            priority_id = @priority_id, status_id = @status_id, is_active = @is_active,
            updated_at = @updated_at, modified_by = @modified_by where id = @id;";
        await cnn.ExecuteAsync(query, entity);
    }
}
