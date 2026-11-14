using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class TextTranslationDao
{
    private readonly string _cnx;
    public TextTranslationDao(string cnx)
    {
        _cnx = cnx;
    }
    public async Task<List<TextTranslation>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<TextTranslation>("select * from public.text_translation order by text_key, language_id")).ToList();
    }
    public async Task<TextTranslation?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<TextTranslation>("select * from public.text_translation where id = @id", new
        {
            id
        });
    }
    public async Task<List<TextTranslation>> GetByAirportId(Guid airportId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<TextTranslation>("select * from public.text_translation where airport_id = @airportId order by text_key, language_id", new
        {
            airportId
        })).ToList();
    }
    public async Task<TextTranslation> Add(TextTranslation entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.text_translation (airport_id, text_key, language_id, text_value, context, is_active,
            created_at, updated_at, created_by, modified_by) values (@airport_id, @text_key, @language_id, @text_value, @context,
            @is_active, @created_at, @updated_at, @created_by, @modified_by) returning id;";
        entity.id = await cnn.QuerySingleAsync<Guid>(query, entity);
        return entity;
    }
    public async Task Update(TextTranslation entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.text_translation set airport_id = @airport_id, text_key = @text_key,
            language_id = @language_id, text_value = @text_value, context = @context, is_active = @is_active,
            updated_at = @updated_at, modified_by = @modified_by where id = @id;";
        await cnn.ExecuteAsync(query, entity);
    }
}
