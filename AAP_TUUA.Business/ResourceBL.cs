using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class ResourceBL
{
    private readonly ResourceDao _resourceDao;
    private readonly ResourceValidator _resourceValidator;

    public ResourceBL(string cnx)
    {
        _resourceDao = new ResourceDao(cnx);
        _resourceValidator = new ResourceValidator();
    }
    
    public async Task<IEnumerable<Resource>?> GetAll()
    {
        return await _resourceDao.GetAll();
    }
    
    
    public async Task<Resource?> GetById(Guid id)
    {
        return await _resourceDao.GetById(id);
    }

    // Resources the user can access (via their active roles), plus the ancestor
    // groups required to keep the menu hierarchy intact.
    public async Task<IEnumerable<Resource>?> GetMenuByUserId(Guid userId)
    {
        var accessible = await _resourceDao.GetByUserId(userId) ?? new List<Resource>();
        var all = await _resourceDao.GetAll() ?? new List<Resource>();

        var allById = all
            .Where(resource => resource.id is not null)
            .ToDictionary(resource => resource.id!.Value);

        var menu = new Dictionary<Guid, Resource>();

        foreach (var resource in accessible)
        {
            if (resource.id is null) continue;
            menu[resource.id.Value] = resource;

            var visited = new HashSet<Guid> { resource.id.Value };
            var parentId = resource.parent_id;
            while (parentId is not null &&
                   !visited.Contains(parentId.Value) &&
                   allById.TryGetValue(parentId.Value, out var parent))
            {
                if (parent.id is null) break;
                visited.Add(parent.id.Value);
                if (parent.is_active == false) break;

                menu[parent.id.Value] = parent;
                parentId = parent.parent_id;
            }
        }

        return menu.Values.ToList();
    }
    
    
    public async Task<Resource?> Add(Resource resource, string userId)
    {
        
        var result = await _resourceValidator.ValidateAsync(resource);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }
        
    
        resource.modified_at = DateTime.Now;
        resource.created_at = DateTime.Now;
        resource.created_by = userId;
        resource.modified_by = userId;
        
        var resp = await _resourceDao.Add(resource);
    
        return resp;
       
    }
    
    public async Task<Resource> Update(Resource resource, string userId)
    {
        
        var result = await _resourceValidator.ValidateAsync(resource);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        if (resource.id == null || resource.id == Guid.Empty)
        {
            throw new Exception("Resource id is required");
        }
        
        var resourceOld = await _resourceDao.GetById(resource.id.Value);
        if (resourceOld == null)
        {
            throw new Exception("Resource not found");
        }
        
        resourceOld.description = resource.description;
        resourceOld.is_active = resource.is_active;
        resourceOld.icon = resource.icon;
        resourceOld.method = resource.method;
        resourceOld.name = resource.name;
        resourceOld.path = resource.path;
        resourceOld.modified_at = DateTime.Now;
        resourceOld.modified_by = userId;
        
        await _resourceDao.Update(resourceOld);

        return resource;
        
    }
    
    
    
    
    
}