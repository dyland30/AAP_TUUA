using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class RunwayBL
{
    private readonly RunwayDao _runwayDao;
    private readonly AirportDao _airportDao;
    private readonly FeatureDao _featureDao;
    private readonly RunwayValidator _runwayValidator;

    public RunwayBL(string cnx)
    {
        _runwayDao = new RunwayDao(cnx);
        _airportDao = new AirportDao(cnx);
        _featureDao = new FeatureDao(cnx);
        _runwayValidator = new RunwayValidator();
    }

    public async Task<IEnumerable<Runway>?> GetAll()
    {
        return await _runwayDao.GetAll();
    }

    public async Task<IEnumerable<Runway>?> GetByAirportId(Guid airportId)
    {
        return await _runwayDao.GetByAirportId(airportId);
    }

    public async Task<Runway?> GetById(Guid id)
    {
        return await _runwayDao.GetById(id);
    }

    public async Task<Runway> Add(Runway runway, string? userId)
    {
        var result = await _runwayValidator.ValidateAsync(runway);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        await ValidateReferences(runway);

        runway.created_at = DateTime.Now;
        runway.updated_at = DateTime.Now;
        runway.created_by = userId;
        runway.modified_by = userId;
        runway.is_active = true;

        return await _runwayDao.Add(runway);
    }

    public async Task<Runway> Update(Runway runway, string? userId)
    {
        var result = await _runwayValidator.ValidateAsync(runway);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        if (runway.id == null || runway.id == Guid.Empty)
        {
            throw new Exception("Runway id is required");
        }

        var runwayDb = await _runwayDao.GetById(runway.id.Value);
        if (runwayDb is null)
        {
            throw new Exception("Runway not found");
        }

        await ValidateReferences(runway);

        runway.created_at = runwayDb.created_at;
        runway.created_by = runwayDb.created_by;
        runway.updated_at = DateTime.Now;
        runway.modified_by = userId;
        await _runwayDao.Update(runway);

        return runway;
    }

    public async Task Delete(Guid id, string? userId)
    {
        var runwayDb = await _runwayDao.GetById(id);
        if (runwayDb is null)
        {
            throw new Exception("Runway not found");
        }

        runwayDb.updated_at = DateTime.Now;
        runwayDb.modified_by = userId;
        runwayDb.is_active = false;
        await _runwayDao.Update(runwayDb);
    }

    private async Task ValidateReferences(Runway runway)
    {
        if (await _airportDao.GetById(runway.airport_id) is null)
        {
            throw new Exception("Airport not found");
        }

        if (await _featureDao.GetFeatureById(runway.status_id) is null)
        {
            throw new Exception("Status not found");
        }
    }
}
