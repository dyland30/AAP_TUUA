using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class CheckinCounterBL
{
    private readonly CheckinCounterDao _checkinCounterDao;
    private readonly AirportResourceDao _airportResourceDao;
    private readonly TerminalDao _terminalDao;
    private readonly FeatureDao _featureDao;
    private readonly CheckinCounterValidator _checkinCounterValidator;

    public CheckinCounterBL(string cnx)
    {
        _checkinCounterDao = new CheckinCounterDao(cnx);
        _airportResourceDao = new AirportResourceDao(cnx);
        _terminalDao = new TerminalDao(cnx);
        _featureDao = new FeatureDao(cnx);
        _checkinCounterValidator = new CheckinCounterValidator();
    }

    public async Task<IEnumerable<CheckinCounter>?> GetAll()
    {
        return await _checkinCounterDao.GetAll();
    }

    public async Task<IEnumerable<CheckinCounter>?> GetByTerminalId(Guid terminalId)
    {
        return await _checkinCounterDao.GetByTerminalId(terminalId);
    }

    public async Task<CheckinCounter?> GetById(Guid resourceId)
    {
        return await _checkinCounterDao.GetById(resourceId);
    }

    public async Task<CheckinCounter> Add(CheckinCounter counter, string? userId)
    {
        var result = await _checkinCounterValidator.ValidateAsync(counter);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        await ValidateReferences(counter);

        if (await _checkinCounterDao.GetById(counter.resource_id!.Value) is not null)
        {
            throw new Exception("Checkin counter already exists for this resource");
        }

        return await _checkinCounterDao.Add(counter);
    }

    public async Task<CheckinCounter> Update(CheckinCounter counter, string? userId)
    {
        var result = await _checkinCounterValidator.ValidateAsync(counter);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        if (counter.resource_id == null || counter.resource_id == Guid.Empty)
        {
            throw new Exception("Checkin counter resource id is required");
        }

        if (await _checkinCounterDao.GetById(counter.resource_id.Value) is null)
        {
            throw new Exception("Checkin counter not found");
        }

        await ValidateReferences(counter);

        await _checkinCounterDao.Update(counter);
        return counter;
    }

    public async Task Delete(Guid resourceId, string? userId)
    {
        if (await _checkinCounterDao.GetById(resourceId) is null)
        {
            throw new Exception("Checkin counter not found");
        }

        await _checkinCounterDao.Delete(resourceId);
    }

    private async Task ValidateReferences(CheckinCounter counter)
    {
        if (await _airportResourceDao.GetById(counter.resource_id!.Value) is null)
        {
            throw new Exception("Airport resource not found");
        }

        if (await _terminalDao.GetById(counter.terminal_id) is null)
        {
            throw new Exception("Terminal not found");
        }

        if (await _featureDao.GetFeatureById(counter.counter_type_id) is null)
        {
            throw new Exception("Counter type not found");
        }
    }
}
