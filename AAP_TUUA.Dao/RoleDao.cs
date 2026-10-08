using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class RoleDao
{
    private readonly string _cnx;

    public RoleDao(string cnx)
    {
        _cnx = cnx;
    }
    
    public async Task<List<Role>> GetAll()
    { 
        List<Role> ls;
        using (IDbConnection cnn = new NpgsqlConnection(_cnx))
        {
            string query = @"select * from role";
            var result = await cnn.QueryAsync<Role>(query);
            ls = result.ToList();
        }

        return ls;
    }
    // get all by Role Id
    public async Task<Role?> GetById(Guid id)
    { 
        Role? role;
        using (IDbConnection cnn = new NpgsqlConnection(_cnx))
        {
            string query = @"select * from role where id = @id";
            role = await cnn.QueryFirstOrDefaultAsync<Role>(query, new { id});
            
        }

        return role;
    }
    
    // add Role
    public async Task<Role> Add(Role role)
    {
        using (IDbConnection cnn = new NpgsqlConnection(_cnx))
        {
            role.id = Guid.NewGuid();
            string query = @"insert into role (id, name, created_at, modified_at, created_by, modified_by, is_active)
                            values (@id, @name, @created_at, @modified_at, @created_by, @modified_by, @is_active)";
           await cnn.ExecuteAsync(query, role);
           return role;
        }
    }
    //add Resource, table role_resource
    public async Task AddResource(RoleResource roleResource)
    {
        using (IDbConnection cnn = new NpgsqlConnection(_cnx))
        {
            roleResource.created_at = DateTime.Now;
            roleResource.modified_at = DateTime.Now;
            string query = @"insert into role_resource (role_id, resource_id, created_at, modified_at, created_by, modified_by)
                            values (@role_id, @resource_id, @created_at, @modified_at, @created_by, @modified_by)";
            await cnn.ExecuteAsync(query, roleResource);
        } 
      
    }
    //remove RoleResource
    public async Task RemoveResource(RoleResource roleResource)
    {
        using (IDbConnection cnn = new NpgsqlConnection(_cnx))
        {
            string query = @"delete from role_resource where role_id = @role_id and resource_id = @resource_id";
            await cnn.ExecuteAsync(query, roleResource);
        } 
         
    }
    // update Role 
    public async Task Update(Role role)
    {
        using (IDbConnection cnn = new NpgsqlConnection(_cnx))
        {
            string query = @"update role 
                            set name = @name,
                                modified_at = @modified_at,
                                modified_by = @modified_by,
                                is_active = @is_active
                            where id = @id;";
            await cnn.ExecuteAsync(query, role);
            
        }
    }
    
    //add role_resource_permission
    public async Task AddRoleResourcePermission(RoleResourcePermissions roleResourcePermissions)
    {
        using (IDbConnection cnn = new NpgsqlConnection(_cnx))
        {
            roleResourcePermissions.created_at = DateTime.Now;
            roleResourcePermissions.updated_at = DateTime.Now;
            string query = @"insert into role_resource_permission (role_id, resource_id, permission_id, is_active, created_at, updated_at, created_by, modified_by)
                            values (@role_id, @resource_id, @permission_id, @is_active, @created_at, @updated_at, @created_by, @modified_by)";
            await cnn.ExecuteAsync(query, roleResourcePermissions);
        } 
    }
    
   
    
    
    //remove role_resource_permission
    public async Task RemoveRoleResourcePermission(RoleResourcePermissions roleResourcePermissions)
    {
        using (IDbConnection cnn = new NpgsqlConnection(_cnx))
        {
            string query = @"delete from role_resource_permission where role_id = @role_id and resource_id = @resource_id and permission_id = @permission_id";
            await cnn.ExecuteAsync(query, roleResourcePermissions);
        } 
    }
    
    //get role_resource_permission by role_id and resource_id and permission_id
    public async Task<RoleResourcePermissions?> GetRoleResourcePermissionByIds(Guid roleId, Guid resourceId, int permissionId)
    {
        using (IDbConnection cnn = new NpgsqlConnection(_cnx))
        {
            string query = @"select * from view_role_resource_permission_expanded where role_id = @roleId and resource_id = @resourceId and permission_id = @permissionId";
            var result = await cnn.QueryFirstOrDefaultAsync<RoleResourcePermissions>(query, new { roleId, resourceId, permissionId });
            return result;
        } 
    }
    
    
    
    //get all resources
    
    public async Task<List<Resource>?> GetAllResources()
    {
        using (IDbConnection cnn = new NpgsqlConnection(_cnx))
        {
            string query = @"select * from resource";
            var result = await cnn.QueryAsync<Resource>(query);
            return result.ToList();
        }
        
    }
    
    // get all resources permissions

    public async Task<List<RoleResourcePermissions>?> GetAllPermissions()
    {
        using (IDbConnection cnn = new NpgsqlConnection(_cnx))
        {
            string query = @"select * from view_role_resource_permission_expanded";
            var result = await cnn.QueryAsync<RoleResourcePermissions>(query);
            return result.ToList();
        }
        
    }
    // get all permissions by role id and resource id
    public async Task<List<RoleResourcePermissions>?> GetPermissionsByRoleIdAndResourceId(Guid roleId, Guid resourceId)
    {
        var resources = await GetAllResources();
        using (IDbConnection cnn = new NpgsqlConnection(_cnx))
        {
            string query = @"select * from view_role_resource_permission_expanded where role_id = @id and resource_id = @resourceId";
            var result = await cnn.QueryAsync<RoleResourcePermissions>(query, new { id = roleId, resourceId  });
            var roleResources = result.ToList();
            foreach (var rr in roleResources)
            {
                rr.resource_id = resources?.FirstOrDefault(r => r.id == rr.resource_id)?.id;
            }
            return roleResources;
        }
        
    }
    
    

    public async Task<List<RoleResource>?> GetResourcesByRoleId(Guid id)
    {
        var resources = await GetAllResources();
        
        var permissions = await GetAllPermissions();
        
        using (IDbConnection cnn = new NpgsqlConnection(_cnx))
        {
            string query = @"select * from role_resource where role_id = @id";
            var result = await cnn.QueryAsync<RoleResource>(query, new { id });
            var roleResources = result.ToList();
            foreach (var rr in roleResources)
            {
                rr.Resource = resources?.FirstOrDefault(r => r.id == rr.resource_id);
                rr.PermissionsList = permissions?.Where(p => p.resource_id == rr.resource_id && p.role_id == rr.role_id).ToList();
            }
            return roleResources;
        }

    }
    //Get Roles by UserId
    public async Task<List<Role>?> GetRolesByUserId(Guid id)
    {
        using (IDbConnection cnn = new NpgsqlConnection(_cnx))
        {
            string query = @"select r.id, r.name, r.created_at, r.modified_at,
                            r.created_by, r.modified_by
                            from user_role ur
                            join role r on ur.role_id = r.id
                            where ur.user_id = @id";
            var result = await cnn.QueryAsync<Role>(query, new { id });
            return result.ToList();
        }
        
    }
    
    //get all UserRoles
    public async Task<List<UserRole>?> GetAllUserRoles()
    {
        using (IDbConnection cnn = new NpgsqlConnection(_cnx))
        {
            string query = @"select * from user_role";
            var result = await cnn.QueryAsync<UserRole>(query);
            return result.ToList();
        }
        
    }
    
    
}