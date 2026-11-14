using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class BehaviorGroupDao
{
    private readonly string _cnx;
    public BehaviorGroupDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<BehaviorGroup>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<BehaviorGroup>("select * from public.behavior_group order by priority, code")).ToList();
    }

    public async Task<BehaviorGroup?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<BehaviorGroup>("select * from public.behavior_group where id = @id", new
        {
            id
        });
    }

    public async Task<List<BehaviorGroup>> GetByAirportId(Guid airportId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<BehaviorGroup>("select * from public.behavior_group where airport_id = @airportId order by priority, code", new
        {
            airportId
        })).ToList();
    }

    public async Task<BehaviorGroup> Add(BehaviorGroup entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.behavior_group (airport_id, code, name, description, standard_number,
            is_standard, display_type_id, content_type_id, flight_direction_id, flight_type_id, priority, is_emergency,
            page_duration_seconds, rows_per_page, alternate_interval_seconds, max_flights, is_active, created_at, updated_at, created_by, modified_by)
            values (@airport_id, @code, @name, @description, @standard_number, @is_standard, @display_type_id, @content_type_id,
            @flight_direction_id, @flight_type_id, @priority, @is_emergency, @page_duration_seconds, @rows_per_page,
            @alternate_interval_seconds, @max_flights, @is_active, @created_at, @updated_at, @created_by, @modified_by) returning id;";
        entity.id = await cnn.QuerySingleAsync<Guid>(query, entity);
        return entity;
    }

    public async Task Update(BehaviorGroup entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.behavior_group set airport_id = @airport_id, code = @code, name = @name,
            description = @description, standard_number = @standard_number, is_standard = @is_standard,
            display_type_id = @display_type_id, content_type_id = @content_type_id, flight_direction_id = @flight_direction_id,
            flight_type_id = @flight_type_id, priority = @priority, is_emergency = @is_emergency,
            page_duration_seconds = @page_duration_seconds, rows_per_page = @rows_per_page,
            alternate_interval_seconds = @alternate_interval_seconds, max_flights = @max_flights,
            is_active = @is_active, updated_at = @updated_at, modified_by = @modified_by where id = @id;";
        await cnn.ExecuteAsync(query, entity);
    }
}
