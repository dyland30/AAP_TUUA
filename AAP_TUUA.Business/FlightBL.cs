using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class FlightBL
{
    private readonly FlightDao _flightDao;
    private readonly AirportDao _airportDao;
    private readonly TerminalDao _terminalDao;
    private readonly LocationDao _locationDao;
    private readonly AirlineDao _airlineDao;
    private readonly AircraftTypeDao _aircraftTypeDao;
    private readonly AircraftDao _aircraftDao;
    private readonly RunwayDao _runwayDao;
    private readonly FeatureDao _featureDao;
    private readonly FlightValidator _flightValidator;

    public FlightBL(string cnx)
    {
        _flightDao = new FlightDao(cnx);
        _airportDao = new AirportDao(cnx);
        _terminalDao = new TerminalDao(cnx);
        _locationDao = new LocationDao(cnx);
        _airlineDao = new AirlineDao(cnx);
        _aircraftTypeDao = new AircraftTypeDao(cnx);
        _aircraftDao = new AircraftDao(cnx);
        _runwayDao = new RunwayDao(cnx);
        _featureDao = new FeatureDao(cnx);
        _flightValidator = new FlightValidator();
    }

    public async Task<IEnumerable<Flight>?> GetAll()
    {
        return await _flightDao.GetAll();
    }

    public async Task<IEnumerable<Flight>?> GetByAirportId(Guid airportId)
    {
        return await _flightDao.GetByAirportId(airportId);
    }

    public async Task<IEnumerable<Flight>?> GetByScheduleDate(Guid airportId, DateTime scheduleDate)
    {
        return await _flightDao.GetByScheduleDate(airportId, scheduleDate);
    }

    public async Task<IEnumerable<Flight>?> GetByAirlineId(Guid airlineId)
    {
        return await _flightDao.GetByAirlineId(airlineId);
    }

    public async Task<IEnumerable<Flight>?> GetByStatusId(int statusId)
    {
        return await _flightDao.GetByStatusId(statusId);
    }

    public async Task<Flight?> GetById(Guid id)
    {
        return await _flightDao.GetById(id);
    }

    public async Task<Flight> Add(Flight flight, string? userId)
    {
        var result = await _flightValidator.ValidateAsync(flight);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        await ValidateReferences(flight);

        var now = DateTime.Now;
        flight.created_at = now;
        flight.updated_at = now;
        flight.created_by = userId;
        flight.modified_by = userId;
        flight.is_active = true;

        return await _flightDao.Add(flight);
    }

    public async Task<Flight> Update(Flight flight, string? userId)
    {
        var result = await _flightValidator.ValidateAsync(flight);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        if (flight.id is null || flight.id == Guid.Empty)
        {
            throw new Exception("Flight id is required");
        }

        var flightDb = await _flightDao.GetById(flight.id.Value);
        if (flightDb is null)
        {
            throw new Exception("Flight not found");
        }

        await ValidateReferences(flight);

        flight.created_at = flightDb.created_at;
        flight.created_by = flightDb.created_by;
        flight.updated_at = DateTime.Now;
        flight.modified_by = userId;

        await _flightDao.Update(flight);

        return flight;
    }

    public async Task Delete(Guid id, string? userId)
    {
        var flightDb = await _flightDao.GetById(id);
        if (flightDb is null)
        {
            throw new Exception("Flight not found");
        }

        flightDb.updated_at = DateTime.Now;
        flightDb.modified_by = userId;
        flightDb.is_active = false;
        await _flightDao.Update(flightDb);
    }

    private async Task ValidateReferences(Flight flight)
    {
        if (await _airportDao.GetById(flight.airport_id) is null)
        {
            throw new Exception("Airport not found");
        }

        if (await _terminalDao.GetById(flight.terminal_id) is null)
        {
            throw new Exception("Terminal not found");
        }

        if (await _locationDao.GetById(flight.location_id) is null)
        {
            throw new Exception("Location not found");
        }

        if (await _airportDao.GetById(flight.other_airport_id) is null)
        {
            throw new Exception("Other airport not found");
        }

        if (await _featureDao.GetFeatureById(flight.flight_direction_id) is null)
        {
            throw new Exception("Flight direction not found");
        }

        if (flight.flight_type_id is not null &&
            await _featureDao.GetFeatureById(flight.flight_type_id.Value) is null)
        {
            throw new Exception("Flight type not found");
        }

        if (await _featureDao.GetFeatureById(flight.service_type_id) is null)
        {
            throw new Exception("Service type not found");
        }

        if (await _featureDao.GetFeatureById(flight.status_id) is null)
        {
            throw new Exception("Status not found");
        }

        if (flight.aircraft_type_id is not null &&
            await _aircraftTypeDao.GetById(flight.aircraft_type_id.Value) is null)
        {
            throw new Exception("Aircraft type not found");
        }

        if (flight.aircraft_id is not null && await _aircraftDao.GetById(flight.aircraft_id.Value) is null)
        {
            throw new Exception("Aircraft not found");
        }

        if (flight.airline_id is not null && await _airlineDao.GetById(flight.airline_id.Value) is null)
        {
            throw new Exception("Airline not found");
        }

        if (flight.runway_id is not null && await _runwayDao.GetById(flight.runway_id.Value) is null)
        {
            throw new Exception("Runway not found");
        }

        if (flight.diverted_to_id is not null && await _airportDao.GetById(flight.diverted_to_id.Value) is null)
        {
            throw new Exception("Diverted airport not found");
        }
    }
}
