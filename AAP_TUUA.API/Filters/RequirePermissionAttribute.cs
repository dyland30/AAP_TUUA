using AAP_TUUA.API.Util;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace AAP_TUUA.API.Filters;

/// <summary>
/// Autorización real por permiso (resourcePath + permissionName), a diferencia
/// de <see cref="AuthFilter"/> (que solo valida que exista un JWT, no permisos).
/// Implementa <see cref="IAsyncAuthorizationFilter"/> (async correcto) en vez
/// de <c>async void</c> como AuthFilter, para que ASP.NET Core sí espere el
/// resultado antes de decidir si continúa hacia la acción.
///
/// No depende de que AuthFilter haya corrido antes (su OnAuthorization es
/// "async void" y no garantiza orden de ejecución entre filtros) — vuelve a
/// resolver el usuario autenticado por su cuenta, reutilizando la misma
/// clave de caché Redis ("User:{userId}", TTL 1h) que AuthFilter ya usa, por
/// lo que en la práctica es un hit de caché tibio, no una consulta nueva a la BD.
///
/// Uso: [RequirePermission("sales/quotations", "Aprobar")] en la acción.
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public class RequirePermissionAttribute : Attribute, IAsyncAuthorizationFilter
{
    private readonly string _resourcePath;
    private readonly string _permissionName;

    public RequirePermissionAttribute(string resourcePath, string permissionName)
    {
        _resourcePath = resourcePath;
        _permissionName = permissionName;
    }

    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        try
        {
            var config = context.HttpContext.RequestServices.GetRequiredService<IConfiguration>();
            
            var cnx = config.GetValue<string>("connectionString") ?? "";

            var tokenUtil = new TokenUtil(config);
            string userId = tokenUtil.GetUserIdFromToken(context.HttpContext.Request);

            var userDao = new LocalUserDao(cnx);
            var roleDao = new RoleDao(cnx);
            
            string cacheKey = $"User:{userId}";
            var user = await LoadUserWithRoles(userDao, roleDao, userId);

            bool allowed = user?.Roles?.Any(role =>
                role.Resources != null && role.Resources.Any(rr =>
                    rr.Resource?.path == _resourcePath &&
                    rr.PermissionsList != null &&
                    rr.PermissionsList.Any(p => p.permission_name == _permissionName))) ?? false;

            if (!allowed)
            {
                context.Result = new ObjectResult(new { message = $"No tiene el permiso '{_permissionName}' sobre '{_resourcePath}'." })
                {
                    StatusCode = StatusCodes.Status403Forbidden
                };
            }
        }
        catch (Exception)
        {
            context.Result = new UnauthorizedResult();
        }
    }

    private static async Task<LocalUser?> LoadUserWithRoles(LocalUserDao userDao, RoleDao roleDao, string userId)
    {
        var user = await userDao.GetById(Guid.Parse(userId));
        if (user?.id == null) return user;

        var roles = await roleDao.GetRolesByUserId(user.id.Value);
        if (roles == null) return user;

        foreach (var role in roles)
        {
            if (role.id == null) continue;
            role.Resources = await roleDao.GetResourcesByRoleId(role.id.Value);
        }
        user.Roles = roles;

        return user;
    }
}