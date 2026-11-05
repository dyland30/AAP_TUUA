using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class ExchangeRateBL
{
    private readonly ExchangeRateDao _exchangeRateDao;
    private readonly FeatureDao _featureDao;
    private readonly ExchangeRateValidator _exchangeRateValidator;

    public ExchangeRateBL(string cnx)
    {
        _exchangeRateDao = new ExchangeRateDao(cnx);
        _featureDao = new FeatureDao(cnx);
        _exchangeRateValidator = new ExchangeRateValidator();
    }

    public async Task<IEnumerable<ExchangeRate>?> GetAll()
    {
        return await _exchangeRateDao.GetAll();
    }

    public async Task<ExchangeRate?> GetById(Guid id)
    {
        return await _exchangeRateDao.GetById(id);
    }

    public async Task<IEnumerable<ExchangeRate>?> GetByCurrencies(int baseCurrencyId, int targetCurrencyId)
    {
        return await _exchangeRateDao.GetByCurrencies(baseCurrencyId, targetCurrencyId);
    }

    public async Task<ExchangeRate?> GetByDayAndCurrencies(DateTime day, int baseCurrencyId, int targetCurrencyId)
    {
        return await _exchangeRateDao.GetByDayAndCurrencies(day, baseCurrencyId, targetCurrencyId);
    }

    public async Task<ExchangeRate> Add(ExchangeRate exchangeRate, string? userId)
    {
        var result = await _exchangeRateValidator.ValidateAsync(exchangeRate);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        await ValidateReferences(exchangeRate);

        exchangeRate.created_at = DateTime.Now;
        exchangeRate.updated_at = DateTime.Now;
        exchangeRate.created_by = userId;
        exchangeRate.modified_by = userId;
        exchangeRate.is_active = true;

        return await _exchangeRateDao.Add(exchangeRate);
    }

    public async Task<ExchangeRate> Update(ExchangeRate exchangeRate, string? userId)
    {
        var result = await _exchangeRateValidator.ValidateAsync(exchangeRate);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        if (exchangeRate.id is null || exchangeRate.id == Guid.Empty)
        {
            throw new Exception("Exchange rate id is required");
        }

        var exchangeRateDb = await _exchangeRateDao.GetById(exchangeRate.id.Value);
        if (exchangeRateDb is null)
        {
            throw new Exception("Exchange rate not found");
        }

        await ValidateReferences(exchangeRate);

        exchangeRate.created_at = exchangeRateDb.created_at;
        exchangeRate.created_by = exchangeRateDb.created_by;
        exchangeRate.updated_at = DateTime.Now;
        exchangeRate.modified_by = userId;
        await _exchangeRateDao.Update(exchangeRate);

        return exchangeRate;
    }

    public async Task Delete(Guid id, string? userId)
    {
        var exchangeRateDb = await _exchangeRateDao.GetById(id);
        if (exchangeRateDb is null)
        {
            throw new Exception("Exchange rate not found");
        }

        exchangeRateDb.updated_at = DateTime.Now;
        exchangeRateDb.modified_by = userId;
        exchangeRateDb.is_active = false;
        await _exchangeRateDao.Update(exchangeRateDb);
    }

    private async Task ValidateReferences(ExchangeRate exchangeRate)
    {
        if (await _featureDao.GetFeatureById(exchangeRate.base_currency_id) is null)
        {
            throw new Exception("Base currency not found");
        }

        if (await _featureDao.GetFeatureById(exchangeRate.target_currency_id) is null)
        {
            throw new Exception("Target currency not found");
        }
    }
}
