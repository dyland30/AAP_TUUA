using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class TurnaroundBL
{
    private readonly TurnaroundDao _turnaroundDao;
    private readonly FlightDao _flightDao;
    private readonly TurnaroundValidator _turnaroundValidator;

    public TurnaroundBL(string cnx)
    {
        _turnaroundDao = new TurnaroundDao(cnx);
        _flightDao = new FlightDao(cnx);
        _turnaroundValidator = new TurnaroundValidator();
    }

    public async Task<IEnumerable<Turnaround>?> GetAll()
    {
        return await _turnaroundDao.GetAll();
    }

    public async Task<IEnumerable<Turnaround>?> GetByArrivalFlightId(Guid arrivalFlightId)
    {
        return await _turnaroundDao.GetByArrivalFlightId(arrivalFlightId);
    }

    public async Task<IEnumerable<Turnaround>?> GetByDepartureFlightId(Guid departureFlightId)
    {
        return await _turnaroundDao.GetByDepartureFlightId(departureFlightId);
    }

    public async Task<Turnaround?> GetById(Guid id)
    {
        return await _turnaroundDao.GetById(id);
    }

    public async Task<Turnaround> Add(Turnaround turnaround, string? userId)
    {
        var result = await _turnaroundValidator.ValidateAsync(turnaround);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        await ValidateReferences(turnaround);

        var now = DateTime.Now;
        turnaround.created_at = now;
        turnaround.updated_at = now;
        turnaround.created_by = userId;
        turnaround.modified_by = userId;

        return await _turnaroundDao.Add(turnaround);
    }

    public async Task<Turnaround> Update(Turnaround turnaround, string? userId)
    {
        var result = await _turnaroundValidator.ValidateAsync(turnaround);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        if (turnaround.id is null || turnaround.id == Guid.Empty)
        {
            throw new Exception("Turnaround id is required");
        }

        var turnaroundDb = await _turnaroundDao.GetById(turnaround.id.Value);
        if (turnaroundDb is null)
        {
            throw new Exception("Turnaround not found");
        }

        await ValidateReferences(turnaround);

        turnaround.created_at = turnaroundDb.created_at;
        turnaround.created_by = turnaroundDb.created_by;
        turnaround.updated_at = DateTime.Now;
        turnaround.modified_by = userId;

        await _turnaroundDao.Update(turnaround);

        return turnaround;
    }

    public async Task Delete(Guid id)
    {
        var turnaroundDb = await _turnaroundDao.GetById(id);
        if (turnaroundDb is null)
        {
            throw new Exception("Turnaround not found");
        }

        await _turnaroundDao.Delete(id);
    }

    private async Task ValidateReferences(Turnaround turnaround)
    {
        if (turnaround.arrival_flight_id is not null &&
            await _flightDao.GetById(turnaround.arrival_flight_id.Value) is null)
        {
            throw new Exception("Arrival flight not found");
        }

        if (turnaround.departure_flight_id is not null &&
            await _flightDao.GetById(turnaround.departure_flight_id.Value) is null)
        {
            throw new Exception("Departure flight not found");
        }
    }
}
