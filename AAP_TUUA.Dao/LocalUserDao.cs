using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class LocalUserDao
{
    private readonly string _cnx;
    private readonly RoleDao _roleDao;
   

    public LocalUserDao(string cnx)
    {
        _cnx = cnx;
        _roleDao = new RoleDao(cnx);
    
    }
    
    public async Task<List<LocalUser>> GetAll()
    { 
        List<LocalUser> ls;
        
        using (IDbConnection cnn = new NpgsqlConnection(_cnx))
        {
            var roles = await _roleDao.GetAll();
            var userRoles = await _roleDao.GetAllUserRoles();
            string query = @"select * from local_user";
            var result = await cnn.QueryAsync<LocalUser>(query);
            ls = result.ToList();
            
            //get roles for each user
            foreach (var localUser in ls)
            {
                localUser.Roles = roles.Where(r => userRoles != null && userRoles.Any(ur => ur.user_id == localUser.id && ur.role_id == r.id)).ToList();
              
            }
            
        }

        return ls;
    }

    

    // get all by LocalUser Id
    public async Task<LocalUser?> GetById(Guid id)
    { 
        LocalUser? localUser;
        using (IDbConnection cnn = new NpgsqlConnection(_cnx))
        {
            string query = @"select * from local_user where id = @id";
            localUser = await cnn.QueryFirstOrDefaultAsync<LocalUser>(query, new { id});
            
        }

        return localUser;
    }
    
    // add LocalUser
    public async Task<LocalUser> Add(LocalUser localUser)
    {
        using (IDbConnection cnn = new NpgsqlConnection(_cnx))
        {
            localUser.id = Guid.NewGuid();
            localUser.created_at = DateTime.Now;
            localUser.modified_at = DateTime.Now;
            
            string query = @"insert into local_user (id, name, email, password_salt, password_hash, 
                                password_reset_token, password_reset_token_expires_at, created_at, modified_at, created_by, 
                                modified_by, is_active, is_deleted, is_verified, verification_code, reset_password_code, last_login_at, is_external)
                                values (@id, @name, @email, @password_salt, @password_hash, @password_reset_token,
                                    @password_reset_token_expires_at, @created_at, @modified_at, @created_by,
                                    @modified_by, @is_active, @is_deleted, @is_verified, @verification_code,
                                    @reset_password_code, @last_login_at, @is_external)";
           await cnn.ExecuteAsync(query, localUser);
           return localUser;
        }
    }
    //add UserRole
    public async Task AddUserRole(UserRole userRole)
    {
        using (IDbConnection cnn = new NpgsqlConnection(_cnx))
        {
            
            userRole.created_at = DateTime.Now;
            userRole.modified_at = DateTime.Now;

            string query = @"insert into user_role (user_id, role_id, created_at, modified_at)
                                values (@user_id, @role_id, @created_at, @modified_at)";
           await cnn.ExecuteAsync(query, userRole);
        } 
         
    }
    //remove UserRole
    public async Task RemoveUserRole(UserRole userRole)
    {
        using (IDbConnection cnn = new NpgsqlConnection(_cnx))
        {

            string query = @"delete from user_role where user_id = @user_id and role_id = @role_id";
           await cnn.ExecuteAsync(query, userRole);
        }
    }
    
    // update LocalUser 
    public async Task Update(LocalUser localUser)
    {
        using (IDbConnection cnn = new NpgsqlConnection(_cnx))
        {
            string query = @"update local_user 
                            set 
                                name = @name,
                                email = @email,
                                password_salt = @password_salt,
                                password_hash = @password_hash,
                                password_reset_token = @password_reset_token,
                                password_reset_token_expires_at = @password_reset_token_expires_at,
                                created_at = @created_at,
                                modified_at = @modified_at,
                                created_by = @created_by,
                                modified_by = @modified_by,
                                is_active = @is_active,
                                is_deleted = @is_deleted,
                                is_verified = @is_verified,
                                verification_code = @verification_code,
                                reset_password_code = @reset_password_code,
                                last_login_at = @last_login_at,
                                is_external = @is_external
                            
                            where id = @id;";
            await cnn.ExecuteAsync(query, localUser);
            
        }
    }

    public async Task<LocalUser?> GetLocalUserByUsername(string username)
    {
        LocalUser? localUser;
        using (IDbConnection cnn = new NpgsqlConnection(_cnx))
        {
            string query = @"select * from local_user where email = @username";
            localUser = await cnn.QueryFirstOrDefaultAsync<LocalUser>(query, new { username });

        }

        return localUser; // null if not found.
    }
    
    //get users by role id
    public async Task<List<LocalUser>> GetUsersByRoleId(Guid roleId)
    {
        List<LocalUser> users = new List<LocalUser>();
        using (IDbConnection cnn = new NpgsqlConnection(_cnx))
        {
            string query = @"select lu.* from local_user lu
                             join user_role ur on lu.id = ur.user_id
                             where ur.role_id = @roleId";
            var result = await cnn.QueryAsync<LocalUser>(query, new { roleId });
            users = result.ToList();
        }

        return users;
    }
    
    //get users by permission name and resource path
    public async Task<List<LocalUser>> GetUsersByPermissionAndResource(string permissionName, string resourcePath)
    {
        List<LocalUser> users;
        using (IDbConnection cnn = new NpgsqlConnection(_cnx))
        {
            string query = @"select u.* from
                            local_user as u
                            inner join user_role as ur on u.id = ur.user_id
                            where role_id in (
                                select
                                rrp.role_id
                            from role_resource_permission as rrp
                                inner join resource as r on r.id = rrp.resource_id
                                inner join public.feature p on p.id = rrp.permission_id
                            where p.description = @permissionName and r.path = @resourcePath
                              and rrp.is_active = true and r.is_active = true
                            );";
            var result = await cnn.QueryAsync<LocalUser>(query, new { permissionName, resourcePath });
            users = result.ToList();
        }

        return users;
    }
}