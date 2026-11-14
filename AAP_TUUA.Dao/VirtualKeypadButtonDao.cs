using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class VirtualKeypadButtonDao
{
    private readonly string _cnx;
    public VirtualKeypadButtonDao(string cnx)
    {
        _cnx = cnx;
    }
    public async Task<List<VirtualKeypadButton>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<VirtualKeypadButton>("select * from public.virtual_keypad_button order by sort_order, id")).ToList();
    }
    public async Task<VirtualKeypadButton?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<VirtualKeypadButton>("select * from public.virtual_keypad_button where id = @id", new
        {
            id
        });
    }
    public async Task<List<VirtualKeypadButton>> GetByAirportId(Guid airportId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<VirtualKeypadButton>("select * from public.virtual_keypad_button where airport_id = @airportId order by sort_order, id", new
        {
            airportId
        })).ToList();
    }
    public async Task<VirtualKeypadButton> Add(VirtualKeypadButton entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.virtual_keypad_button (airport_id, airline_id, target_status_id, label_es, label_en,
            color, sort_order, requires_confirmation, is_active, created_at, updated_at, created_by, modified_by)
            values (@airport_id, @airline_id, @target_status_id, @label_es, @label_en, @color, @sort_order,
            @requires_confirmation, @is_active, @created_at, @updated_at, @created_by, @modified_by) returning id;";
        entity.id = await cnn.QuerySingleAsync<Guid>(query, entity);
        return entity;
    }
    public async Task Update(VirtualKeypadButton entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.virtual_keypad_button set airport_id = @airport_id, airline_id = @airline_id,
            target_status_id = @target_status_id, label_es = @label_es, label_en = @label_en, color = @color,
            sort_order = @sort_order, requires_confirmation = @requires_confirmation, is_active = @is_active,
            updated_at = @updated_at, modified_by = @modified_by where id = @id;";
        await cnn.ExecuteAsync(query, entity);
    }
}
