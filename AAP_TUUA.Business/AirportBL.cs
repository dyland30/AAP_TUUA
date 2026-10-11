using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class AirportBL
{
    private readonly AirportDao _airportDao;
    private readonly AirportValidator _airportValidator;

    public AirportBL(string cnx)
    {
        _airportDao = new AirportDao(cnx);
        _airportValidator = new AirportValidator();
    }

    public async Task<IEnumerable<Airport>?> GetAll()
    {
        return await _airportDao.GetAll();
    }

    public async Task<Airport?> GetById(Guid id)
    {
        return await _airportDao.GetById(id);
    }

    public async Task<Airport> Add(Airport airport, string? userId)
    {
        var result = await _airportValidator.ValidateAsync(airport);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        airport.created_at = DateTime.Now;
        airport.updated_at = DateTime.Now;
        airport.created_by = userId;
        airport.modified_by = userId;
        airport.is_active = true;

        return await _airportDao.Add(airport);
    }

    public async Task<Airport> Update(Airport airport, string? userId)
    {
        var result = await _airportValidator.ValidateAsync(airport);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        if (airport.id == null || airport.id == Guid.Empty)
        {
            throw new Exception("Airport id is required");
        }

        var airportDb = await _airportDao.GetById(airport.id.Value);
        if (airportDb is null)
        {
            throw new Exception("Airport not found");
        }

        airport.created_at = airportDb.created_at;
        airport.created_by = airportDb.created_by;
        airport.updated_at = DateTime.Now;
        airport.modified_by = userId;
        await _airportDao.Update(airport);

        return airport;
    }

    public async Task Delete(Guid id, string? userId)
    {
        var airportDb = await _airportDao.GetById(id);
        if (airportDb is null)
        {
            throw new Exception("Airport not found");
        }

        airportDb.updated_at = DateTime.Now;
        airportDb.modified_by = userId;
        airportDb.is_active = false;
        await _airportDao.Update(airportDb);
    }
}
