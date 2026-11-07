using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class TuuaGateUnlockKeyUsageHistoryBL
{
    private const int MaxSearchDays = 92;
    private const int MaxPageSize = 100;
    private const int MaxExportRows = 50000;

    private readonly TuuaGateUnlockKeyUsageHistoryDao _historyDao;
    private readonly TuuaGateDao _tuuaGateDao;
    private readonly TuuaGateUnlockKeyDao _unlockKeyDao;
    private readonly TuuaGateUnlockKeyUsageHistoryValidator _historyValidator;

    public TuuaGateUnlockKeyUsageHistoryBL(string cnx)
    {
        _historyDao = new TuuaGateUnlockKeyUsageHistoryDao(cnx);
        _tuuaGateDao = new TuuaGateDao(cnx);
        _unlockKeyDao = new TuuaGateUnlockKeyDao(cnx);
        _historyValidator = new TuuaGateUnlockKeyUsageHistoryValidator();
    }

    public async Task<IEnumerable<TuuaGateUnlockKeyUsageHistory>?> GetAll()
    {
        return await _historyDao.GetAll();
    }

    public async Task<TuuaGateUnlockKeyUsageHistory?> GetById(Guid id)
    {
        return await _historyDao.GetById(id);
    }

    public async Task<IEnumerable<TuuaGateUnlockKeyUsageHistory>?> GetByTuuaGateCode(string tuuaGateCode)
    {
        return await _historyDao.GetByTuuaGateCode(tuuaGateCode);
    }

    public async Task<PagedResult<TuuaGateUnlockKeyUsageReportItem>> Search(TuuaGateUnlockKeyUsageFilter filter)
    {
        ValidateSearchFilter(filter);

        filter.page = Math.Max(1, filter.page);
        filter.page_size = Math.Clamp(filter.page_size, 1, MaxPageSize);

        return await _historyDao.Search(filter);
    }

    // Exporta a Excel todos los usos que cumplen los filtros (sin paginar), hasta MaxExportRows.
    public async Task<byte[]> Export(TuuaGateUnlockKeyUsageFilter filter)
    {
        ValidateSearchFilter(filter);

        var rows = await _historyDao.Export(filter, MaxExportRows + 1);
        if (rows.Count > MaxExportRows)
        {
            throw new Exception($"The export exceeds {MaxExportRows} rows; narrow the filters");
        }

        return TuuaGateUnlockKeyUsageExcelBL.Generate(rows);
    }

    private static void ValidateSearchFilter(TuuaGateUnlockKeyUsageFilter filter)
    {
        if (filter.date_from is null || filter.date_to is null)
        {
            throw new Exception("The date range is required");
        }

        if (filter.date_from.Value.Date > filter.date_to.Value.Date)
        {
            throw new Exception("The start date cannot be after the end date");
        }

        if ((filter.date_to.Value.Date - filter.date_from.Value.Date).TotalDays > MaxSearchDays)
        {
            throw new Exception($"The date range cannot exceed {MaxSearchDays} days");
        }
    }

    public async Task<TuuaGateUnlockKeyUsageHistory> Add(TuuaGateUnlockKeyUsageHistory history, string? userId)
    {
        var result = await _historyValidator.ValidateAsync(history);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        if (await _unlockKeyDao.GetById(history.tuua_gate_unlock_keys_id!.Value) is null)
        {
            throw new Exception("Unlock key not found");
        }

        if (await _tuuaGateDao.GetByCode(history.tuua_gate_code) is null)
        {
            throw new Exception("Tuua gate not found");
        }

        history.created_at = DateTime.Now;
        history.updated_at = DateTime.Now;
        history.created_by = userId;
        history.modified_by = userId;

        return await _historyDao.Add(history);
    }
}
