using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class FeatureTranslationDao
{
    private readonly string _cnx;
    public FeatureTranslationDao(string cnx)
    {
        _cnx = cnx;
    }
    public async Task<List<FeatureTranslation>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<FeatureTranslation>("select * from public.feature_translation order by feature_id, language_id")).ToList();
    }
    public async Task<FeatureTranslation?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<FeatureTranslation>("select * from public.feature_translation where id = @id", new
        {
            id
        });
    }
    public async Task<List<FeatureTranslation>> GetByFeatureId(int featureId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<FeatureTranslation>("select * from public.feature_translation where feature_id = @featureId order by language_id", new
        {
            featureId
        })).ToList();
    }
    public async Task<FeatureTranslation> Add(FeatureTranslation entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.feature_translation (feature_id, language_id, short_text, long_text, is_active,
            created_at, updated_at, created_by, modified_by) values (@feature_id, @language_id, @short_text, @long_text,
            @is_active, @created_at, @updated_at, @created_by, @modified_by) returning id;";
        entity.id = await cnn.QuerySingleAsync<Guid>(query, entity);
        return entity;
    }
    public async Task Update(FeatureTranslation entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.feature_translation set feature_id = @feature_id, language_id = @language_id,
            short_text = @short_text, long_text = @long_text, is_active = @is_active,
            updated_at = @updated_at, modified_by = @modified_by where id = @id;";
        await cnn.ExecuteAsync(query, entity);
    }
}
