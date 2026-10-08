using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class FeatureDao
{
    private readonly string _cnx;

    public FeatureDao(string cnx)
    {
        _cnx = cnx;
    }
    
    public async Task<List<FeatureGroup>?> GetAllFeatureGroup()
    { 
        List<FeatureGroup> ls;
        using (IDbConnection cnn = new NpgsqlConnection(_cnx))
        {
            string query = @"select * from feature_group";
            var result = await cnn.QueryAsync<FeatureGroup>(query);
            ls = result.ToList();
        }

        return ls;
    }
    // Resuelve el id de un feature_group por su nombre (usado por módulos que
    // seedean su propio grupo en una migración, sin id fijo conocido de antemano).
    public async Task<int?> GetFeatureGroupIdByName(string name)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<int?>(
            "select id from feature_group where name = @name", new { name });
    }

    // get all by feature group
    public async Task<List<Feature>?> GetByFeatureGroup(int groupId)
    { 
        List<Feature> ls;
        using (IDbConnection cnn = new NpgsqlConnection(_cnx))
        {
            string query = @"select * from feature where feature_group_id = @groupId";
            var result = await cnn.QueryAsync<Feature>(query, new {groupId});
            ls = result.ToList();
        }

        return ls;
    }
    
    //get by feature group and description
    public async Task<List<Feature>?> GetByFeatureGroupAndDescription(int groupId, string description)
    {
        List<Feature> ls;
        using (IDbConnection cnn = new NpgsqlConnection(_cnx))
        {
            string query = @"select * from feature where feature_group_id = @groupId and TRIM(LOWER(description)) = TRIM(LOWER(@description)) and is_active = true";
            var result = await cnn.QueryAsync<Feature>(query, new {groupId, description});
            ls = result.ToList();
            
        }
        
        return ls;
    }
    
    
    // add Feature Group
    public async Task<FeatureGroup> AddFeatureGroup(FeatureGroup featureGroup)
    {
        using (IDbConnection cnn = new NpgsqlConnection(_cnx))
        {
            string query = @"insert into feature_group (name, description,created_by,created_date,modified_by,modified_date)
                             values (@name, @description,@created_by,@created_date,@modified_by,@modified_date) returning id;";
           featureGroup.id = await cnn.QueryFirstOrDefaultAsync<int>(query, featureGroup);
            
        }

        return featureGroup;
    }
    // add Feature
    public async Task<Feature> AddFeature(Feature feature)
    {
        using (IDbConnection cnn = new NpgsqlConnection(_cnx))
        {
            string query = @"insert into feature (description, abbreviation, feature_value, is_active, parent_id, feature_group_id
                                ,created_by,created_date,modified_by,modified_date)
                             values (@description, @abbreviation, @feature_value, @is_active, @parent_id, @feature_group_id
                             ,@created_by,@created_date,@modified_by,@modified_date)
                             returning id;";
           feature.id = await cnn.QueryFirstOrDefaultAsync<int>(query, feature);
           return feature;
        }
    }
    //Get Feature by Id
    public async Task<Feature?> GetFeatureById(int id)
    {
        Feature? feature = null;
        using (IDbConnection cnn = new NpgsqlConnection(_cnx))
        {
            string query = @"select * from feature where id = @id";
            feature = await cnn.QueryFirstOrDefaultAsync<Feature>(query, new {id});
        }
        return feature; 
    }
    // update Feature Group
    public async Task UpdateFeatureGroup(FeatureGroup featureGroup)
    {
        using (IDbConnection cnn = new NpgsqlConnection(_cnx))
        {
            string query = @"update feature_group 
                            set name = @name, description = @description,
                            modified_by = @modified_by,
                            modified_date = @modified_date
                            where id = @id;";
            await cnn.ExecuteAsync(query, featureGroup);
            
        }
    }
    
    // update Feature
    public async Task UpdateFeature(Feature feature)
    {
        using (IDbConnection cnn = new NpgsqlConnection(_cnx))
        {
            string query = @"update feature 
            set description = @description, abbreviation = @abbreviation, 
                feature_value = @feature_value, is_active = @is_active, 
                parent_id = @parent_id, feature_group_id = @feature_group_id,
                modified_by = @modified_by,
                modified_date = @modified_date
                where id = @id;";
            await cnn.ExecuteAsync(query, feature);
            
        }
    }
    
    
    
}