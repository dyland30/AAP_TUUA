using AAP_TUUA.Business.Util;
using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class LocalUserBL
{
    private readonly LocalUserDao _localUserDao;
    private readonly RoleDao _roleDao;
    private readonly LocalUserValidator _localUserValidator;
    private readonly UserRoleValidator _userRoleValidator;

    public LocalUserBL(string cnx)
    {
        _localUserDao = new LocalUserDao(cnx);
        _roleDao = new RoleDao(cnx);
        _localUserValidator = new LocalUserValidator();
        _userRoleValidator = new UserRoleValidator();
    }

    public async Task<List<LocalUser>> GetAll()
    {
        return await _localUserDao.GetAll();
    }

    public async Task<LocalUser?> GetById(Guid id)
    {
        var localUser = await _localUserDao.GetById(id);
        if (localUser is null) return null;

        var roles = await _roleDao.GetRolesByUserId(id);
        if (roles is null) return localUser;

        foreach (var role in roles)
        {
            if (role.id is null) continue;
            role.Resources = await _roleDao.GetResourcesByRoleId(role.id.Value);
        }

        localUser.Roles = roles;
        return localUser;
    }

    public async Task<LocalUser> Add(LocalUser localUser, string userId)
    {
        var result = await _localUserValidator.ValidateAsync(localUser);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        if (string.IsNullOrEmpty(localUser.password))
        {
            throw new Exception("Password should not be null");
        }

        if (localUser.password != localUser.confirm_password)
        {
            throw new Exception("Passwords do not match");
        }

        var existing = await _localUserDao.GetLocalUserByUsername(localUser.email!);
        if (existing != null)
        {
            throw new Exception("Email already registered");
        }

        localUser.created_at = DateTime.Now;
        localUser.modified_at = DateTime.Now;

        localUser.created_by = userId;
        localUser.modified_by = userId;

        localUser.password_hash = Security.HashPassword(localUser.password, out var salt);
        localUser.password_salt = Convert.ToBase64String(salt);

        localUser.is_verified = false;
        localUser.is_active = true;
        localUser.password = null;
        localUser.confirm_password = null;

        await _localUserDao.Add(localUser);

        if (localUser.Roles is null) return localUser;

        foreach (var rol in localUser.Roles)
        {
            if (rol.id is null) continue;
            var role = await _roleDao.GetById(rol.id.Value);
            if (role is null) continue;

            var userRole = new UserRole
            {
                user_id = localUser.id,
                role_id = rol.id,
                created_at = DateTime.Now,
                modified_at = DateTime.Now,
                created_by = userId,
                modified_by = userId
            };
            await _localUserDao.AddUserRole(userRole);
        }

        return localUser;
    }

    public async Task AddUserRole(UserRole userRole, string userId)
    {
        var result = await _userRoleValidator.ValidateAsync(userRole);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        var user = await _localUserDao.GetById(userRole.user_id!.Value);
        if (user is null) throw new Exception("User not found");

        var role = await _roleDao.GetById(userRole.role_id!.Value);
        if (role is null) throw new Exception("Role not found");

        userRole.created_at = DateTime.Now;
        userRole.modified_at = DateTime.Now;
        userRole.created_by = userId;
        userRole.modified_by = userId;
        await _localUserDao.AddUserRole(userRole);
    }

    public async Task Update(LocalUser localUser, string userId)
    {
        var result = await _localUserValidator.ValidateAsync(localUser);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        var oldUser = await _localUserDao.GetById(localUser.id!.Value);
        if (oldUser is null)
        {
            throw new Exception("User not found");
        }

        oldUser.modified_at = DateTime.Now;
        oldUser.modified_by = userId;
        oldUser.name = localUser.name;
        oldUser.email = localUser.email;

        if (!string.IsNullOrEmpty(localUser.password))
        {
            if (localUser.password != localUser.confirm_password)
            {
                throw new Exception("Passwords do not match");
            }

            oldUser.password_hash = Security.HashPassword(localUser.password, out var salt);
            oldUser.password_salt = Convert.ToBase64String(salt);
        }

        await _localUserDao.Update(oldUser);

        if (localUser.Roles is null) return;

        var currentRoles = await _roleDao.GetRolesByUserId(localUser.id!.Value) ?? new List<Role>();
        var currentRoleIds = currentRoles
            .Where(role => role.id is not null)
            .Select(role => role.id!.Value)
            .ToHashSet();

        var desiredRoleIds = localUser.Roles
            .Where(role => role.id is not null)
            .Select(role => role.id!.Value)
            .ToHashSet();

        // Remove roles that are no longer assigned.
        foreach (var currentRoleId in currentRoleIds)
        {
            if (desiredRoleIds.Contains(currentRoleId)) continue;

            await _localUserDao.RemoveUserRole(new UserRole
            {
                user_id = localUser.id,
                role_id = currentRoleId
            });
        }

        // Add newly assigned roles.
        foreach (var desiredRoleId in desiredRoleIds)
        {
            if (currentRoleIds.Contains(desiredRoleId)) continue;

            var role = await _roleDao.GetById(desiredRoleId);
            if (role is null) continue;

            await _localUserDao.AddUserRole(new UserRole
            {
                user_id = localUser.id,
                role_id = desiredRoleId,
                created_at = DateTime.Now,
                modified_at = DateTime.Now,
                created_by = userId,
                modified_by = userId
            });
        }
    }

    public async Task Delete(Guid id, string userId)
    {
        var userDb = await _localUserDao.GetById(id);
        if (userDb is null)
        {
            throw new Exception("User not found");
        }

        userDb.is_deleted = true;
        userDb.is_active = false;
        userDb.modified_at = DateTime.Now;
        userDb.modified_by = userId;
        await _localUserDao.Update(userDb);
    }

    public async Task RemoveUserRole(UserRole userRole)
    {
        if (userRole.user_id is null || userRole.role_id is null)
        {
            throw new Exception("user_id and role_id are required");
        }

        await _localUserDao.RemoveUserRole(userRole);
    }

    public async Task<LocalUser?> GetLocalUserByUsername(string username)
    {
        return await _localUserDao.GetLocalUserByUsername(username);
    }

    public async Task<List<LocalUser>> GetUsersByRoleId(Guid roleId)
    {
        return await _localUserDao.GetUsersByRoleId(roleId);
    }

    public async Task<List<LocalUser>> GetUsersByPermissionAndResource(string permissionName, string resourcePath)
    {
        return await _localUserDao.GetUsersByPermissionAndResource(permissionName, resourcePath);
    }
}
