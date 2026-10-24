using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class TuuaPriceBL
{
    private readonly TuuaPriceDao _tuuaPriceDao;
    private readonly LocationDao _locationDao;
    private readonly TerminalDao _terminalDao;
    private readonly FeatureDao _featureDao;
    private readonly TuuaPriceValidator _tuuaPriceValidator;

    public TuuaPriceBL(string cnx)
    {
        _tuuaPriceDao = new TuuaPriceDao(cnx);
        _locationDao = new LocationDao(cnx);
        _terminalDao = new TerminalDao(cnx);
        _featureDao = new FeatureDao(cnx);
        _tuuaPriceValidator = new TuuaPriceValidator();
    }

    public async Task<IEnumerable<TuuaPrice>?> GetAll()
    {
        return await _tuuaPriceDao.GetAll();
    }

    public async Task<TuuaPrice?> GetById(Guid id)
    {
        return await _tuuaPriceDao.GetById(id);
    }

    public async Task<IEnumerable<TuuaPrice>?> GetByLocationAndTerminal(Guid locationId, Guid terminalId)
    {
        return await _tuuaPriceDao.GetByLocationAndTerminal(locationId, terminalId);
    }

    public async Task<TuuaPrice?> GetActivePrice(int flightTypeId, Guid locationId, Guid terminalId,
        int currencyId, DateTime date)
    {
        return await _tuuaPriceDao.GetActivePrice(flightTypeId, locationId, terminalId, currencyId, date);
    }

    public async Task<TuuaPrice> Add(TuuaPrice tuuaPrice, string? userId)
    {
        var result = await _tuuaPriceValidator.ValidateAsync(tuuaPrice);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        await ValidateReferences(tuuaPrice);

        tuuaPrice.created_at = DateTime.Now;
        tuuaPrice.updated_at = DateTime.Now;
        tuuaPrice.created_by = userId;
        tuuaPrice.modified_by = userId;

        return await _tuuaPriceDao.Add(tuuaPrice);
    }

    public async Task<TuuaPrice> Update(TuuaPrice tuuaPrice, string? userId)
    {
        var result = await _tuuaPriceValidator.ValidateAsync(tuuaPrice);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        if (tuuaPrice.id == null || tuuaPrice.id == Guid.Empty)
        {
            throw new Exception("Tuua price id is required");
        }

        var tuuaPriceDb = await _tuuaPriceDao.GetById(tuuaPrice.id.Value);
        if (tuuaPriceDb is null)
        {
            throw new Exception("Tuua price not found");
        }

        await ValidateReferences(tuuaPrice);

        tuuaPrice.created_at = tuuaPriceDb.created_at;
        tuuaPrice.created_by = tuuaPriceDb.created_by;
        tuuaPrice.updated_at = DateTime.Now;
        tuuaPrice.modified_by = userId;
        await _tuuaPriceDao.Update(tuuaPrice);

        return tuuaPrice;
    }

    public async Task Delete(Guid id, string? userId)
    {
        var tuuaPriceDb = await _tuuaPriceDao.GetById(id);
        if (tuuaPriceDb is null)
        {
            throw new Exception("Tuua price not found");
        }

        tuuaPriceDb.updated_at = DateTime.Now;
        tuuaPriceDb.modified_by = userId;
        tuuaPriceDb.is_active = false;
        await _tuuaPriceDao.Update(tuuaPriceDb);
    }

    private async Task ValidateReferences(TuuaPrice tuuaPrice)
    {
        var location = await _locationDao.GetById(tuuaPrice.location_id);
        if (location is null)
        {
            throw new Exception("Location not found");
        }

        var terminal = await _terminalDao.GetById(tuuaPrice.terminal_id);
        if (terminal is null)
        {
            throw new Exception("Terminal not found");
        }

        if (terminal.location_id != tuuaPrice.location_id)
        {
            throw new Exception("Terminal does not belong to the selected location");
        }

        if (await _featureDao.GetFeatureById(tuuaPrice.flight_type_id) is null)
        {
            throw new Exception("Flight type not found");
        }

        if (await _featureDao.GetFeatureById(tuuaPrice.currency_id) is null)
        {
            throw new Exception("Currency not found");
        }
    }
}
