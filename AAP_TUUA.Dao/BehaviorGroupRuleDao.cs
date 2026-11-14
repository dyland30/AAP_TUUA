using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class BehaviorGroupRuleDao
{
    private readonly string _cnx;
    public BehaviorGroupRuleDao(string cnx)
    {
        _cnx = cnx;
    }
    public async Task<List<BehaviorGroupRule>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<BehaviorGroupRule>("select * from public.behavior_group_rule order by behavior_group_id, sort_order, id")).ToList();
    }
    public async Task<BehaviorGroupRule?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<BehaviorGroupRule>("select * from public.behavior_group_rule where id = @id", new
        {
            id
        });
    }
    public async Task<List<BehaviorGroupRule>> GetByBehaviorGroupId(Guid behaviorGroupId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<BehaviorGroupRule>("select * from public.behavior_group_rule where behavior_group_id = @behaviorGroupId order by sort_order, id", new
        {
            behaviorGroupId
        })).ToList();
    }
    public async Task<BehaviorGroupRule> Add(BehaviorGroupRule entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.behavior_group_rule (behavior_group_id, rule_type_id, field_id, operator_id,
            rule_value, status_filter_ids, show_from_offset_min, show_until_offset_min, duration_seconds, priority,
            sort_order, airport_sector_id, is_active, created_at, updated_at, created_by, modified_by)
            values (@behavior_group_id, @rule_type_id, @field_id, @operator_id, @rule_value, @status_filter_ids,
            @show_from_offset_min, @show_until_offset_min, @duration_seconds, @priority, @sort_order, @airport_sector_id,
            @is_active, @created_at, @updated_at, @created_by, @modified_by) returning id;";
        entity.id = await cnn.QuerySingleAsync<Guid>(query, entity);
        return entity;
    }
    public async Task Update(BehaviorGroupRule entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.behavior_group_rule set behavior_group_id = @behavior_group_id, rule_type_id = @rule_type_id,
            field_id = @field_id, operator_id = @operator_id, rule_value = @rule_value, status_filter_ids = @status_filter_ids,
            show_from_offset_min = @show_from_offset_min, show_until_offset_min = @show_until_offset_min,
            duration_seconds = @duration_seconds, priority = @priority, sort_order = @sort_order, airport_sector_id = @airport_sector_id,
            is_active = @is_active, updated_at = @updated_at, modified_by = @modified_by where id = @id;";
        await cnn.ExecuteAsync(query, entity);
    }
}
