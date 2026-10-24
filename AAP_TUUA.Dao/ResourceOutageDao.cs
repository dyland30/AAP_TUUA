using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class ResourceOutageDao
{
    private readonly string _cnx;

    public ResourceOutageDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<ResourceOutage>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<ResourceOutage>(
            "select * from public.resource_outage order by start_date desc");
        return result.ToList();
    }

    public async Task<List<ResourceOutage>> GetByResourceId(Guid resourceId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<ResourceOutage>(
            @"select * from public.resource_outage
              where resource_id = @resourceId
              order by start_date desc", new { resourceId });
        return result.ToList();
    }

    public async Task<List<ResourceOutage>> GetActiveByResourceId(Guid resourceId, DateTime date)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<ResourceOutage>(
            @"select * from public.resource_outage
              where resource_id = @resourceId
                and is_active = true
                and start_date <= @date
                and (end_date is null or end_date >= @date)
              order by start_date desc", new { resourceId, date });
        return result.ToList();
    }

    public async Task<ResourceOutage?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<ResourceOutage>(
            "select * from public.resource_outage where id = @id", new { id });
    }

    public async Task<ResourceOutage> Add(ResourceOutage outage)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.resource_outage (resource_id, start_date, end_date, reason,
                             is_planned, is_active, created_at, updated_at, created_by, modified_by)
                         values (@resource_id, @start_date, @end_date, @reason,
                             @is_planned, @is_active, @created_at, @updated_at, @created_by, @modified_by)
                         returning id;";
        outage.id = await cnn.QueryFirstOrDefaultAsync<Guid>(query, outage);
        return outage;
    }

    public async Task Update(ResourceOutage outage)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.resource_outage
                         set resource_id = @resource_id,
                             start_date = @start_date,
                             end_date = @end_date,
                             reason = @reason,
                             is_planned = @is_planned,
                             is_active = @is_active,
                             updated_at = @updated_at,
                             modified_by = @modified_by
                         where id = @id;";
        await cnn.ExecuteAsync(query, outage);
    }

    public async Task Delete(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync("delete from public.resource_outage where id = @id", new { id });
    }
}
