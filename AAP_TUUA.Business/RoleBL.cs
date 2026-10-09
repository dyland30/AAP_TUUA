using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class RoleBL
{
    private readonly RoleDao _roleDao;
    private readonly ResourceDao _resourceDao;
    private readonly FeatureDao _featureDao;
    private readonly RoleValidator _roleValidator;
    private readonly RoleResourceValidator _roleResourceValidator;

    public RoleBL(string cnx)
    {
        _roleDao = new RoleDao(cnx);
        _resourceDao = new ResourceDao(cnx);
        _featureDao = new FeatureDao(cnx);
        _roleValidator = new RoleValidator();
        _roleResourceValidator = new RoleResourceValidator();
    }
    
    public async Task<IEnumerable<Role>?> GetAll()
    {
        return await _roleDao.GetAll();
    }
    
    public async Task<Role?> GetById(Guid id)
    {
        var role = await _roleDao.GetById(id);
        if (role is null) return null;
        //get resources by rol id
        var resources = await _roleDao.GetResourcesByRoleId(id);
        role.Resources = resources;
        return role;
    }


    public async Task<Role> Add(Role role, string userId)
    {
        //validate

        var result = await _roleValidator.ValidateAsync(role);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        role.modified_at = DateTime.Now;
        role.created_at = DateTime.Now;
        role.created_by = userId;
        role.modified_by = userId;
        role.is_active = true;

        var resp = await _roleDao.Add(role);

        return resp;
    }
    
    public async Task Update(Role role, string userId)
    {
        var result = await _roleValidator.ValidateAsync(role);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error); 
        }
    
        role.modified_at = DateTime.Now;
        role.modified_by = userId;
        await _roleDao.Update(role);

    }
    
    public async Task Delete(Guid id, string userId)
    {
        var roleDb = await _roleDao.GetById(id);
        if (roleDb is null)
        {
            throw new Exception("role not found");
        }
        roleDb.modified_at = DateTime.Now;
        roleDb.modified_by = userId;
        roleDb.is_active = false;
        await _roleDao.Update(roleDb);

    }
    
    
    
    public async Task<RoleResource?> AddRoleResource(RoleResource roleResource, string userId)
    {
        
        var result = await _roleResourceValidator.ValidateAsync(roleResource);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }
        //check if role exists
        var role = await _roleDao.GetById(roleResource.role_id!.Value);
        if (role == null)
        {
            throw new Exception("Role not found");
        }
        //check if resource exists
        var resource = await _resourceDao.GetById(roleResource.resource_id!.Value);
        if (resource == null)
        {
            throw new Exception("Resource not found");
        }
        roleResource.created_at = DateTime.Now;
        roleResource.modified_at = DateTime.Now;
        roleResource.created_by = userId;
        roleResource.modified_by = userId;
        
        await _roleDao.AddResource(roleResource);
        return roleResource;
        
    }
    
    public async Task RemoveRoleResource(RoleResource roleResource)
    {
    
        //check if role exists
        var role = await _roleDao.GetById(roleResource.role_id!.Value);
        if (role == null)
        {
            throw new Exception("Role not found");
        }
        //check if resource exists
        var resource = await _resourceDao.GetById(roleResource.resource_id!.Value);
        if (resource == null)
        {
            throw new Exception("Resource not found");
        }
        await _roleDao.RemoveResource(roleResource);
           
       
    }
    
    public async Task AddRoleResourcePermission(RoleResourcePermissions roleResourcePermission)
    {
  
        // check if role exists
        var role = await _roleDao.GetById(roleResourcePermission.role_id!.Value);
        if (role == null)
        {
            throw new Exception("Role not found");
        }
        // check if resource exists
        var resource = await _resourceDao.GetById(roleResourcePermission.resource_id!.Value);
        if (resource == null)
        {
            throw new Exception("Resource not found");
        }
        
        // check if permission exists in feature
        var feature = await _featureDao.GetFeatureById(roleResourcePermission.permission_id!.Value);
        if (feature == null)
        {
            throw new Exception("Permission not found");
        }
        
        await _roleDao.AddRoleResourcePermission(roleResourcePermission);
    
    }
    
    public async Task RemoveRoleResourcePermission(RoleResourcePermissions roleResourcePermission)
    {
        
        // check if RoleResourcePermission exists
        var roleResourcePerm = await _roleDao.GetRoleResourcePermissionByIds(roleResourcePermission.role_id!.Value, 
            roleResourcePermission.resource_id!.Value, roleResourcePermission.permission_id!.Value);
        
        if (roleResourcePerm == null)
        {
            throw new Exception("RoleResourcePermission not found");
        }
        
        await _roleDao.RemoveRoleResourcePermission(roleResourcePermission);
            
    }
    
    public async Task<IEnumerable<RoleResourcePermissions>?> GetPermissionsByRoleIdAndResourceId(Guid roleId, Guid resourceId)
    {
        var permissions = await _roleDao.GetPermissionsByRoleIdAndResourceId(roleId, resourceId);
        return permissions;
    
    }
    
    
    public async Task<RoleResourcePermissions?> GetRoleResourcePermissionByIds(Guid roleId, Guid resourceId, int permissionId)
    {
        var roleResourcePermission = await _roleDao.GetRoleResourcePermissionByIds(roleId, resourceId, permissionId);
        return roleResourcePermission;
    
    }


}