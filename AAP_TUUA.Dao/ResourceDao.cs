using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class ResourceDao
{
    private readonly string _cnx;

    public ResourceDao(string cnx)
    {
        _cnx = cnx;
    }
    
    public async Task<List<Resource>?> GetAll()
    { 
        List<Resource> ls;
        using (IDbConnection cnn = new NpgsqlConnection(_cnx))
        {
            string query = @"select * from view_resource_expanded";
            var result = await cnn.QueryAsync<Resource>(query);
            ls = result.ToList();
        }

        return ls;
    }
    // get all by Resource Id
    public async Task<Resource?> GetById(Guid id)
    { 
        Resource? resource;
        using (IDbConnection cnn = new NpgsqlConnection(_cnx))
        {
            string query = @"select * from view_resource_expanded where id = @id";
            resource = await cnn.QueryFirstOrDefaultAsync<Resource>(query, new { id});
            
        }

        return resource;
    }
    
    // add Resource
    public async Task<Resource> Add(Resource resource)
    {
        using (IDbConnection cnn = new NpgsqlConnection(_cnx))
        {
            resource.id = Guid.NewGuid();
            
            string query = @"insert into resource (id, name, description, type, path, method, parent_id, created_at, modified_at, created_by,
                      modified_by, weight, icon, is_active)
                      values (@id, @name, @description, @type, @path, @method, @parent_id, @created_at, @modified_at, @created_by,
                              @modified_by, @weight, @icon, @is_active)";
           await cnn.ExecuteAsync(query, resource);
           return resource;
        }
    }
    // update Resource 
    public async Task Update(Resource resource)
    {
        using (IDbConnection cnn = new NpgsqlConnection(_cnx))
        {
            string query = @"update resource 
                            set name = @name,
                                description = @description,
                                type = @type,
                                path = @path,
                                method = @method,
                                parent_id = @parent_id,
                                created_at = @created_at,
                                modified_at = @modified_at,
                                created_by = @created_by,
                                modified_by = @modified_by,
                                weight = @weight,
                                icon = @icon,
                                is_active = @is_active
                            where id = @id;";
            await cnn.ExecuteAsync(query, resource);
            
        }
    }
}