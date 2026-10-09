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