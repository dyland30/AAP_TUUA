using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class AircraftBL
{
    private readonly AircraftDao _aircraftDao;
    private readonly AircraftTypeDao _aircraftTypeDao;
    private readonly AirlineDao _airlineDao;
    private readonly AircraftValidator _aircraftValidator;

    public AircraftBL(string cnx)
    {
        _aircraftDao = new AircraftDao(cnx);
        _aircraftTypeDao = new AircraftTypeDao(cnx);
        _airlineDao = new AirlineDao(cnx);
        _aircraftValidator = new AircraftValidator();
    }

    public async Task<IEnumerable<Aircraft>?> GetAll()
    {
        return await _aircraftDao.GetAll();
    }

    public async Task<IEnumerable<Aircraft>?> GetByOperatorId(Guid operatorId)
    {
        return await _aircraftDao.GetByOperatorId(operatorId);
    }

    public async Task<IEnumerable<Aircraft>?> GetByAircraftTypeId(Guid aircraftTypeId)
    {
        return await _aircraftDao.GetByAircraftTypeId(aircraftTypeId);
    }

    public async Task<Aircraft?> GetById(Guid id)
    {
        return await _aircraftDao.GetById(id);
    }

    public async Task<Aircraft> Add(Aircraft aircraft, string? userId)
    {
        var result = await _aircraftValidator.ValidateAsync(aircraft);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        await ValidateReferences(aircraft);

        var now = DateTime.Now;
        aircraft.created_at = now;
        aircraft.updated_at = now;
        aircraft.created_by = userId;
        aircraft.modified_by = userId;
        aircraft.is_active = true;

        return await _aircraftDao.Add(aircraft);
    }

    public async Task<Aircraft> Update(Aircraft aircraft, string? userId)
    {
        var result = await _aircraftValidator.ValidateAsync(aircraft);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        if (aircraft.id is null || aircraft.id == Guid.Empty)
        {
            throw new Exception("Aircraft id is required");
        }

        var aircraftDb = await _aircraftDao.GetById(aircraft.id.Value);
        if (aircraftDb is null)
        {
            throw new Exception("Aircraft not found");
        }

        await ValidateReferences(aircraft);

        aircraft.created_at = aircraftDb.created_at;
        aircraft.created_by = aircraftDb.created_by;
        aircraft.updated_at = DateTime.Now;
        aircraft.modified_by = userId;

        await _aircraftDao.Update(aircraft);

        return aircraft;
    }

    public async Task Delete(Guid id, string? userId)
    {
        var aircraftDb = await _aircraftDao.GetById(id);
        if (aircraftDb is null)
        {
            throw new Exception("Aircraft not found");
        }

        aircraftDb.updated_at = DateTime.Now;
        aircraftDb.modified_by = userId;
        aircraftDb.is_active = false;
        await _aircraftDao.Update(aircraftDb);
    }

    private async Task ValidateReferences(Aircraft aircraft)
    {
        if (await _aircraftTypeDao.GetById(aircraft.aircraft_type_id) is null)
        {
            throw new Exception("Aircraft type not found");
        }

        if (aircraft.operator_id is not null && await _airlineDao.GetById(aircraft.operator_id.Value) is null)
        {
            throw new Exception("Operator not found");
        }
    }
}
