using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class FlightCodeshareBL
{
    private readonly FlightCodeshareDao _flightCodeshareDao;
    private readonly FlightDao _flightDao;
    private readonly AirlineDao _airlineDao;
    private readonly FlightCodeshareValidator _flightCodeshareValidator;

    public FlightCodeshareBL(string cnx)
    {
        _flightCodeshareDao = new FlightCodeshareDao(cnx);
        _flightDao = new FlightDao(cnx);
        _airlineDao = new AirlineDao(cnx);
        _flightCodeshareValidator = new FlightCodeshareValidator();
    }

    public async Task<IEnumerable<FlightCodeshare>?> GetAll()
    {
        return await _flightCodeshareDao.GetAll();
    }

    public async Task<IEnumerable<FlightCodeshare>?> GetByFlightId(Guid flightId)
    {
        return await _flightCodeshareDao.GetByFlightId(flightId);
    }

    public async Task<IEnumerable<FlightCodeshare>?> GetByAirlineId(Guid airlineId)
    {
        return await _flightCodeshareDao.GetByAirlineId(airlineId);
    }

    public async Task<FlightCodeshare?> GetById(Guid flightId, Guid airlineId, string flightIdentity)
    {
        return await _flightCodeshareDao.GetById(flightId, airlineId, flightIdentity);
    }

    public async Task<FlightCodeshare> Add(FlightCodeshare codeshare, string? userId)
    {
        var result = await _flightCodeshareValidator.ValidateAsync(codeshare);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        if (await _flightDao.GetById(codeshare.flight_id) is null)
        {
            throw new Exception("Flight not found");
        }

        if (await _airlineDao.GetById(codeshare.airline_id) is null)
        {
            throw new Exception("Airline not found");
        }

        await _flightCodeshareDao.Add(codeshare);

        return codeshare;
    }

    public async Task Delete(Guid flightId, Guid airlineId, string flightIdentity)
    {
        var codeshareDb = await _flightCodeshareDao.GetById(flightId, airlineId, flightIdentity);
        if (codeshareDb is null)
        {
            throw new Exception("Flight codeshare not found");
        }

        await _flightCodeshareDao.Delete(flightId, airlineId, flightIdentity);
    }
}
