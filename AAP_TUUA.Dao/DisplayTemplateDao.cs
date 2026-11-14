using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class DisplayTemplateDao
{
    private readonly string _cnx;
    public DisplayTemplateDao(string cnx)
    {
        _cnx = cnx;
    }
    public async Task<List<DisplayTemplate>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<DisplayTemplate>("select * from public.display_template order by code")).ToList();
    }
    public async Task<DisplayTemplate?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<DisplayTemplate>("select * from public.display_template where id = @id", new
        {
            id
        });
    }
    public async Task<List<DisplayTemplate>> GetByAirportId(Guid airportId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<DisplayTemplate>("select * from public.display_template where airport_id = @airportId order by code", new
        {
            airportId
        })).ToList();
    }
    public async Task<DisplayTemplate> Add(DisplayTemplate entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.display_template (airport_id, code, name, description, display_type_id,
            orientation_id, resolution_id, flight_slots, current_version_id, is_virtual_keypad, is_active,
            created_at, updated_at, created_by, modified_by)
            values (@airport_id, @code, @name, @description, @display_type_id, @orientation_id, @resolution_id,
            @flight_slots, @current_version_id, @is_virtual_keypad, @is_active, @created_at, @updated_at, @created_by, @modified_by) returning id;";
        entity.id = await cnn.QuerySingleAsync<Guid>(query, entity);
        return entity;
    }
    public async Task Update(DisplayTemplate entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.display_template set airport_id = @airport_id, code = @code, name = @name,
            description = @description, display_type_id = @display_type_id, orientation_id = @orientation_id,
            resolution_id = @resolution_id, flight_slots = @flight_slots, current_version_id = @current_version_id,
            is_virtual_keypad = @is_virtual_keypad, is_active = @is_active, updated_at = @updated_at, modified_by = @modified_by where id = @id;";
        await cnn.ExecuteAsync(query, entity);
    }
}
