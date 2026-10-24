using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class AirportResourceBL
{
    private readonly AirportResourceDao _airportResourceDao;
    private readonly TerminalDao _terminalDao;
    private readonly FeatureDao _featureDao;
    private readonly AirportResourceValidator _airportResourceValidator;

    public AirportResourceBL(string cnx)
    {
        _airportResourceDao = new AirportResourceDao(cnx);
        _terminalDao = new TerminalDao(cnx);
        _featureDao = new FeatureDao(cnx);
        _airportResourceValidator = new AirportResourceValidator();
    }

    public async Task<IEnumerable<AirportResource>?> GetAll()
    {
        return await _airportResourceDao.GetAll();
    }

    public async Task<IEnumerable<AirportResource>?> GetByTerminalId(Guid terminalId)
    {
        return await _airportResourceDao.GetByTerminalId(terminalId);
    }

    public async Task<IEnumerable<AirportResource>?> GetByResourceTypeId(int resourceTypeId)
    {
        return await _airportResourceDao.GetByResourceTypeId(resourceTypeId);
    }

    public async Task<AirportResource?> GetByCode(string code)
    {
        return await _airportResourceDao.GetByCode(code);
    }

    public async Task<AirportResource?> GetById(Guid id)
    {
        return await _airportResourceDao.GetById(id);
    }

    public async Task<AirportResource> Add(AirportResource resource, string? userId)
    {
        var result = await _airportResourceValidator.ValidateAsync(resource);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        await ValidateReferences(resource);

        if (await _airportResourceDao.GetByCode(resource.code) is not null)
        {
            throw new Exception("Resource code already exists");
        }

        resource.created_at = DateTime.Now;
        resource.updated_at = DateTime.Now;
        resource.created_by = userId;
        resource.modified_by = userId;
        resource.is_active = true;

        return await _airportResourceDao.Add(resource);
    }

    public async Task<AirportResource> Update(AirportResource resource, string? userId)
    {
        var result = await _airportResourceValidator.ValidateAsync(resource);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        if (resource.id == null || resource.id == Guid.Empty)
        {
            throw new Exception("Airport resource id is required");
        }

        var resourceDb = await _airportResourceDao.GetById(resource.id.Value);
        if (resourceDb is null)
        {
            throw new Exception("Airport resource not found");
        }

        await ValidateReferences(resource);

        var resourceWithCode = await _airportResourceDao.GetByCode(resource.code);
        if (resourceWithCode is not null && resourceWithCode.id != resource.id)
        {
            throw new Exception("Resource code already exists");
        }

        resource.created_at = resourceDb.created_at;
        resource.created_by = resourceDb.created_by;
        resource.updated_at = DateTime.Now;
        resource.modified_by = userId;
        await _airportResourceDao.Update(resource);

        return resource;
    }

    public async Task Delete(Guid id, string? userId)
    {
        var resourceDb = await _airportResourceDao.GetById(id);
        if (resourceDb is null)
        {
            throw new Exception("Airport resource not found");
        }

        resourceDb.updated_at = DateTime.Now;
        resourceDb.modified_by = userId;
        resourceDb.is_active = false;
        await _airportResourceDao.Update(resourceDb);
    }

    private async Task ValidateReferences(AirportResource resource)
    {
        if (await _terminalDao.GetById(resource.terminal_id) is null)
        {
            throw new Exception("Terminal not found");
        }

        if (await _featureDao.GetFeatureById(resource.resource_type_id) is null)
        {
            throw new Exception("Resource type not found");
        }

        if (await _featureDao.GetFeatureById(resource.flight_type_id) is null)
        {
            throw new Exception("Flight type not found");
        }

        if (await _featureDao.GetFeatureById(resource.status_id) is null)
        {
            throw new Exception("Status not found");
        }
    }
}
