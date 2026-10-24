using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class ResourceOutageBL
{
    private readonly ResourceOutageDao _resourceOutageDao;
    private readonly AirportResourceDao _airportResourceDao;
    private readonly ResourceOutageValidator _resourceOutageValidator;

    public ResourceOutageBL(string cnx)
    {
        _resourceOutageDao = new ResourceOutageDao(cnx);
        _airportResourceDao = new AirportResourceDao(cnx);
        _resourceOutageValidator = new ResourceOutageValidator();
    }

    public async Task<IEnumerable<ResourceOutage>?> GetAll()
    {
        return await _resourceOutageDao.GetAll();
    }

    public async Task<IEnumerable<ResourceOutage>?> GetByResourceId(Guid resourceId)
    {
        return await _resourceOutageDao.GetByResourceId(resourceId);
    }

    public async Task<IEnumerable<ResourceOutage>?> GetActiveByResourceId(Guid resourceId, DateTime date)
    {
        return await _resourceOutageDao.GetActiveByResourceId(resourceId, date);
    }

    public async Task<ResourceOutage?> GetById(Guid id)
    {
        return await _resourceOutageDao.GetById(id);
    }

    public async Task<ResourceOutage> Add(ResourceOutage outage, string? userId)
    {
        var result = await _resourceOutageValidator.ValidateAsync(outage);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        if (await _airportResourceDao.GetById(outage.resource_id) is null)
        {
            throw new Exception("Airport resource not found");
        }

        outage.created_at = DateTime.Now;
        outage.updated_at = DateTime.Now;
        outage.created_by = userId;
        outage.modified_by = userId;
        outage.is_active = true;

        return await _resourceOutageDao.Add(outage);
    }

    public async Task<ResourceOutage> Update(ResourceOutage outage, string? userId)
    {
        var result = await _resourceOutageValidator.ValidateAsync(outage);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        if (outage.id == null || outage.id == Guid.Empty)
        {
            throw new Exception("Resource outage id is required");
        }

        var outageDb = await _resourceOutageDao.GetById(outage.id.Value);
        if (outageDb is null)
        {
            throw new Exception("Resource outage not found");
        }

        if (await _airportResourceDao.GetById(outage.resource_id) is null)
        {
            throw new Exception("Airport resource not found");
        }

        outage.created_at = outageDb.created_at;
        outage.created_by = outageDb.created_by;
        outage.updated_at = DateTime.Now;
        outage.modified_by = userId;
        await _resourceOutageDao.Update(outage);

        return outage;
    }

    public async Task Delete(Guid id, string? userId)
    {
        var outageDb = await _resourceOutageDao.GetById(id);
        if (outageDb is null)
        {
            throw new Exception("Resource outage not found");
        }

        outageDb.updated_at = DateTime.Now;
        outageDb.modified_by = userId;
        outageDb.is_active = false;
        await _resourceOutageDao.Update(outageDb);
    }
}
