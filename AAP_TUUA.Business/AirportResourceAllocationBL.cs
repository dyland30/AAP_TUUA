using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class AirportResourceAllocationBL
{
    private readonly AirportResourceAllocationDao _allocationDao;
    private readonly AirportResourceDao _airportResourceDao;
    private readonly FlightDao _flightDao;
    private readonly TurnaroundDao _turnaroundDao;
    private readonly AirlineDao _airlineDao;
    private readonly FeatureDao _featureDao;
    private readonly AirportResourceAllocationValidator _allocationValidator;

    public AirportResourceAllocationBL(string cnx)
    {
        _allocationDao = new AirportResourceAllocationDao(cnx);
        _airportResourceDao = new AirportResourceDao(cnx);
        _flightDao = new FlightDao(cnx);
        _turnaroundDao = new TurnaroundDao(cnx);
        _airlineDao = new AirlineDao(cnx);
        _featureDao = new FeatureDao(cnx);
        _allocationValidator = new AirportResourceAllocationValidator();
    }

    public async Task<IEnumerable<AirportResourceAllocation>?> GetAll()
    {
        return await _allocationDao.GetAll();
    }

    public async Task<IEnumerable<AirportResourceAllocation>?> GetByAirportResourceId(Guid airportResourceId)
    {
        return await _allocationDao.GetByAirportResourceId(airportResourceId);
    }

    public async Task<IEnumerable<AirportResourceAllocation>?> GetByFlightId(Guid flightId)
    {
        return await _allocationDao.GetByFlightId(flightId);
    }

    public async Task<IEnumerable<AirportResourceAllocation>?> GetByTurnaroundId(Guid turnaroundId)
    {
        return await _allocationDao.GetByTurnaroundId(turnaroundId);
    }

    public async Task<IEnumerable<AirportResourceAllocation>?> GetByAirlineId(Guid airlineId)
    {
        return await _allocationDao.GetByAirlineId(airlineId);
    }

    public async Task<IEnumerable<AirportResourceAllocation>?> GetActiveByAirportResourceId(Guid airportResourceId, DateTime date)
    {
        return await _allocationDao.GetActiveByAirportResourceId(airportResourceId, date);
    }

    public async Task<AirportResourceAllocation?> GetById(Guid id)
    {
        return await _allocationDao.GetById(id);
    }

    public async Task<AirportResourceAllocation> Add(AirportResourceAllocation allocation, string? userId)
    {
        var result = await _allocationValidator.ValidateAsync(allocation);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        await ValidateReferences(allocation);

        allocation.created_at = DateTime.Now;
        allocation.updated_at = DateTime.Now;
        allocation.created_by = userId;
        allocation.modified_by = userId;
        allocation.is_active = true;

        return await _allocationDao.Add(allocation);
    }

    public async Task<AirportResourceAllocation> Update(AirportResourceAllocation allocation, string? userId)
    {
        var result = await _allocationValidator.ValidateAsync(allocation);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        if (allocation.id == null || allocation.id == Guid.Empty)
        {
            throw new Exception("Airport resource allocation id is required");
        }

        var allocationDb = await _allocationDao.GetById(allocation.id.Value);
        if (allocationDb is null)
        {
            throw new Exception("Airport resource allocation not found");
        }

        await ValidateReferences(allocation);

        allocation.created_at = allocationDb.created_at;
        allocation.created_by = allocationDb.created_by;
        allocation.updated_at = DateTime.Now;
        allocation.modified_by = userId;
        await _allocationDao.Update(allocation);

        return allocation;
    }

    public async Task Delete(Guid id, string? userId)
    {
        var allocationDb = await _allocationDao.GetById(id);
        if (allocationDb is null)
        {
            throw new Exception("Airport resource allocation not found");
        }

        allocationDb.updated_at = DateTime.Now;
        allocationDb.modified_by = userId;
        allocationDb.is_active = false;
        await _allocationDao.Update(allocationDb);
    }

    private async Task ValidateReferences(AirportResourceAllocation allocation)
    {
        if (await _airportResourceDao.GetById(allocation.airport_resource_id) is null)
        {
            throw new Exception("Airport resource not found");
        }

        if (allocation.flight_id is not null &&
            await _flightDao.GetById(allocation.flight_id.Value) is null)
        {
            throw new Exception("Flight not found");
        }

        if (allocation.turnaround_id is not null &&
            await _turnaroundDao.GetById(allocation.turnaround_id.Value) is null)
        {
            throw new Exception("Turnaround not found");
        }

        if (allocation.airline_id is not null &&
            await _airlineDao.GetById(allocation.airline_id.Value) is null)
        {
            throw new Exception("Airline not found");
        }

        if (await _featureDao.GetFeatureById(allocation.status_id) is null)
        {
            throw new Exception("Status not found");
        }
    }
}
