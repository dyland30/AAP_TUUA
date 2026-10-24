using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class StandBL
{
    private readonly StandDao _standDao;
    private readonly AirportResourceDao _airportResourceDao;
    private readonly FeatureDao _featureDao;
    private readonly StandValidator _standValidator;

    public StandBL(string cnx)
    {
        _standDao = new StandDao(cnx);
        _airportResourceDao = new AirportResourceDao(cnx);
        _featureDao = new FeatureDao(cnx);
        _standValidator = new StandValidator();
    }

    public async Task<IEnumerable<Stand>?> GetAll()
    {
        return await _standDao.GetAll();
    }

    public async Task<IEnumerable<Stand>?> GetByTerminalId(Guid terminalId)
    {
        return await _standDao.GetByTerminalId(terminalId);
    }

    public async Task<Stand?> GetById(Guid resourceId)
    {
        return await _standDao.GetById(resourceId);
    }

    public async Task<Stand> Add(Stand stand, string? userId)
    {
        var result = await _standValidator.ValidateAsync(stand);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        if (await _airportResourceDao.GetById(stand.resource_id!.Value) is null)
        {
            throw new Exception("Airport resource not found");
        }

        if (await _standDao.GetById(stand.resource_id!.Value) is not null)
        {
            throw new Exception("Stand already exists for this resource");
        }

        if (await _featureDao.GetFeatureById(stand.max_aircraft_size_type) is null)
        {
            throw new Exception("Aircraft size type not found");
        }

        return await _standDao.Add(stand);
    }

    public async Task<Stand> Update(Stand stand, string? userId)
    {
        var result = await _standValidator.ValidateAsync(stand);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        if (stand.resource_id == null || stand.resource_id == Guid.Empty)
        {
            throw new Exception("Stand resource id is required");
        }

        if (await _standDao.GetById(stand.resource_id.Value) is null)
        {
            throw new Exception("Stand not found");
        }

        if (await _featureDao.GetFeatureById(stand.max_aircraft_size_type) is null)
        {
            throw new Exception("Aircraft size type not found");
        }

        await _standDao.Update(stand);
        return stand;
    }

    public async Task Delete(Guid resourceId, string? userId)
    {
        if (await _standDao.GetById(resourceId) is null)
        {
            throw new Exception("Stand not found");
        }

        await _standDao.Delete(resourceId);
    }
}
