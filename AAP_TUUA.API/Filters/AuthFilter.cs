using AAP_TUUA.API.Util;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace AAP_TUUA.API.Filters;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class AuthFilter :  Attribute, IAuthorizationFilter
{
   

  
    private async Task ValidateToken(HttpRequest request, IConfiguration config)
    {
        try
        {
            //Console.WriteLine($"User ID: {userId}");
            TokenUtil tokenUtil = new TokenUtil(config);
            //get user by id
            var userDao = new LocalUserDao(config.GetValue<string>("connectionString")??"");
            var roleDao = new RoleDao(config.GetValue<string>("connectionString")??"");
        
            
            string userId = tokenUtil.GetUserIdFromToken(request);
        
            string cacheKey = $"User:{userId}";
            var user = await GetUserFromDb(userDao, userId, roleDao);
            if (user == null) return;

        }
        catch (Exception e)
        {
            Console.WriteLine(e);
            throw;
        }
        
        
        //Console.WriteLine($"User: {JsonSerializer.Serialize(user)}");
    }

    private static async Task<LocalUser?> GetUserFromDb(LocalUserDao userDao, string userId, RoleDao roleDao)
    {
        var user = await userDao.GetById(Guid.Parse(userId));
        if (user?.id == null) return user;
        var roles = await roleDao.GetRolesByUserId(user.id.Value);
        if (roles == null) return user;
        foreach (var role in roles)
        {
            if (role.id == null) continue;
            var resources = await roleDao.GetResourcesByRoleId(role.id.Value);
            role.Resources = resources;
        }
        user.Roles = roles;

        return user;
    }


    public async void OnAuthorization(AuthorizationFilterContext context)
    {
        try
        {
            var config = context.HttpContext.RequestServices.GetRequiredService<IConfiguration>();
            
            
            // Check for authorization header
            if (!context.HttpContext.Request.Headers.ContainsKey("Authorization"))
            {
                context.Result = new UnauthorizedResult();
                return;
            }
            
            await ValidateToken(context.HttpContext.Request, config);
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex);
            context.Result = new UnauthorizedResult();
            
        }
        
    }
}