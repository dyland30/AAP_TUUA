using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class BehaviorGroupTemplateDao
{
    private readonly string _cnx;
    public BehaviorGroupTemplateDao(string cnx)
    {
        _cnx = cnx;
    }
    public async Task<List<BehaviorGroupTemplate>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<BehaviorGroupTemplate>("select * from public.behavior_group_template order by behavior_group_id, id")).ToList();
    }
    public async Task<BehaviorGroupTemplate?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<BehaviorGroupTemplate>("select * from public.behavior_group_template where id = @id", new
        {
            id
        });
    }
    public async Task<List<BehaviorGroupTemplate>> GetByBehaviorGroupId(Guid behaviorGroupId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<BehaviorGroupTemplate>("select * from public.behavior_group_template where behavior_group_id = @behaviorGroupId order by id", new
        {
            behaviorGroupId
        })).ToList();
    }
    public async Task<BehaviorGroupTemplate> Add(BehaviorGroupTemplate entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.behavior_group_template (behavior_group_id, display_template_id, orientation_id,
            resolution_id, flight_slots, is_default, is_active, created_at, updated_at, created_by, modified_by)
            values (@behavior_group_id, @display_template_id, @orientation_id, @resolution_id, @flight_slots,
            @is_default, @is_active, @created_at, @updated_at, @created_by, @modified_by) returning id;";
        entity.id = await cnn.QuerySingleAsync<Guid>(query, entity);
        return entity;
    }
    public async Task Update(BehaviorGroupTemplate entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.behavior_group_template set behavior_group_id = @behavior_group_id,
            display_template_id = @display_template_id, orientation_id = @orientation_id, resolution_id = @resolution_id,
            flight_slots = @flight_slots, is_default = @is_default, is_active = @is_active,
            updated_at = @updated_at, modified_by = @modified_by where id = @id;";
        await cnn.ExecuteAsync(query, entity);
    }
}
