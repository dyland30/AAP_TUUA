using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class LocationBL
{
    private readonly LocationDao _locationDao;
    private readonly AirportDao _airportDao;
    private readonly LocationValidator _locationValidator;

    public LocationBL(string cnx)
    {
        _locationDao = new LocationDao(cnx);
        _airportDao = new AirportDao(cnx);
        _locationValidator = new LocationValidator();
    }

    public async Task<IEnumerable<Location>?> GetAll()
    {
        return await _locationDao.GetAll();
    }

    public async Task<Location?> GetById(Guid id)
    {
        return await _locationDao.GetById(id);
    }

    public async Task<IEnumerable<Location>?> GetByAirportId(Guid airportId)
    {
        return await _locationDao.GetByAirportId(airportId);
    }

    public async Task<Location> Add(Location location)
    {
        var result = await _locationValidator.ValidateAsync(location);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        if (location.airport_id.HasValue && await _airportDao.GetById(location.airport_id.Value) is null)
        {
            throw new Exception("Airport not found");
        }

        return await _locationDao.Add(location);
    }

    public async Task<Location> Update(Location location)
    {
        var result = await _locationValidator.ValidateAsync(location);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        if (location.id == null || location.id == Guid.Empty)
        {
            throw new Exception("Location id is required");
        }

        if (await _locationDao.GetById(location.id.Value) is null)
        {
            throw new Exception("Location not found");
        }

        if (location.airport_id.HasValue && await _airportDao.GetById(location.airport_id.Value) is null)
        {
            throw new Exception("Airport not found");
        }

        await _locationDao.Update(location);
        return location;
    }

    public async Task Delete(Guid id)
    {
        if (await _locationDao.GetById(id) is null)
        {
            throw new Exception("Location not found");
        }

        await _locationDao.Delete(id);
    }
}
