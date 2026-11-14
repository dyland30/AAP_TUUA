using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class EmergencyMessageTemplateDao
{
    private readonly string _cnx;
    public EmergencyMessageTemplateDao(string cnx)
    {
        _cnx = cnx;
    }
    public async Task<List<EmergencyMessageTemplate>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<EmergencyMessageTemplate>("select * from public.emergency_message_template order by alert_type_id, language_id, id")).ToList();
    }
    public async Task<EmergencyMessageTemplate?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<EmergencyMessageTemplate>("select * from public.emergency_message_template where id = @id", new
        {
            id
        });
    }
    public async Task<List<EmergencyMessageTemplate>> GetByAirportId(Guid airportId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<EmergencyMessageTemplate>("select * from public.emergency_message_template where airport_id = @airportId order by alert_type_id, language_id, id", new
        {
            airportId
        })).ToList();
    }
    public async Task<EmergencyMessageTemplate> Add(EmergencyMessageTemplate entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.emergency_message_template (airport_id, alert_type_id, language_id, title, subtitle,
            instructions, ticker_text, icon_media_asset_id, display_template_id, is_active, created_at, updated_at, created_by, modified_by)
            values (@airport_id, @alert_type_id, @language_id, @title, @subtitle, cast(@instructions as jsonb), @ticker_text,
            @icon_media_asset_id, @display_template_id, @is_active, @created_at, @updated_at, @created_by, @modified_by) returning id;";
        entity.id = await cnn.QuerySingleAsync<Guid>(query, entity);
        return entity;
    }
    public async Task Update(EmergencyMessageTemplate entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.emergency_message_template set airport_id = @airport_id, alert_type_id = @alert_type_id,
            language_id = @language_id, title = @title, subtitle = @subtitle, instructions = cast(@instructions as jsonb),
            ticker_text = @ticker_text, icon_media_asset_id = @icon_media_asset_id, display_template_id = @display_template_id,
            is_active = @is_active, updated_at = @updated_at, modified_by = @modified_by where id = @id;";
        await cnn.ExecuteAsync(query, entity);
    }
}
