using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class CashFlowBL
{
    private readonly CashFlowDao _cashFlowDao;
    private readonly CashierMachineSessionDao _cashierMachineSessionDao;
    private readonly TuuaSalesOperationDao _tuuaSalesOperationDao;
    private readonly MoneyExchangeOperationDao _moneyExchangeOperationDao;
    private readonly FeatureDao _featureDao;
    private readonly CashFlowValidator _cashFlowValidator;

    public CashFlowBL(string cnx)
    {
        _cashFlowDao = new CashFlowDao(cnx);
        _cashierMachineSessionDao = new CashierMachineSessionDao(cnx);
        _tuuaSalesOperationDao = new TuuaSalesOperationDao(cnx);
        _moneyExchangeOperationDao = new MoneyExchangeOperationDao(cnx);
        _featureDao = new FeatureDao(cnx);
        _cashFlowValidator = new CashFlowValidator();
    }

    public async Task<IEnumerable<CashFlow>?> GetAll()
    {
        return await _cashFlowDao.GetAll();
    }

    public async Task<CashFlow?> GetById(Guid id)
    {
        return await _cashFlowDao.GetById(id);
    }

    public async Task<IEnumerable<CashFlow>?> GetByCashierMachineSessionId(Guid cashierMachineSessionId)
    {
        return await _cashFlowDao.GetByCashierMachineSessionId(cashierMachineSessionId);
    }

    public async Task<IEnumerable<CashFlow>?> GetBySalesOperationId(Guid tuuaSalesOperationId)
    {
        return await _cashFlowDao.GetBySalesOperationId(tuuaSalesOperationId);
    }

    public async Task<IEnumerable<CashFlow>?> GetByMoneyExchangeOperationId(Guid moneyExchangeOperationId)
    {
        return await _cashFlowDao.GetByMoneyExchangeOperationId(moneyExchangeOperationId);
    }

    public async Task<CashFlow> Add(CashFlow cashFlow, string? userId)
    {
        var result = await _cashFlowValidator.ValidateAsync(cashFlow);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        ValidateDirection(cashFlow);
        await ValidateReferences(cashFlow);

        // no se registran movimientos en un turno ya cerrado
        var session = await _cashierMachineSessionDao.GetById(cashFlow.cashier_machine_session_id);
        if (session?.end_time is not null)
        {
            throw new Exception("The cashier machine session is already closed");
        }

        cashFlow.created_at = DateTime.Now;
        cashFlow.updated_at = DateTime.Now;
        cashFlow.created_by = userId;
        cashFlow.modified_by = userId;
        cashFlow.is_active = true;

        return await _cashFlowDao.Add(cashFlow);
    }

    public async Task<CashFlow> Update(CashFlow cashFlow, string? userId)
    {
        var result = await _cashFlowValidator.ValidateAsync(cashFlow);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        if (cashFlow.id is null || cashFlow.id == Guid.Empty)
        {
            throw new Exception("Cash flow id is required");
        }

        var cashFlowDb = await _cashFlowDao.GetById(cashFlow.id.Value);
        if (cashFlowDb is null)
        {
            throw new Exception("Cash flow not found");
        }

        ValidateDirection(cashFlow);
        await ValidateReferences(cashFlow);

        cashFlow.created_at = cashFlowDb.created_at;
        cashFlow.created_by = cashFlowDb.created_by;
        cashFlow.updated_at = DateTime.Now;
        cashFlow.modified_by = userId;
        await _cashFlowDao.Update(cashFlow);

        return cashFlow;
    }

    public async Task Delete(Guid id, string? userId)
    {
        var cashFlowDb = await _cashFlowDao.GetById(id);
        if (cashFlowDb is null)
        {
            throw new Exception("Cash flow not found");
        }

        cashFlowDb.updated_at = DateTime.Now;
        cashFlowDb.modified_by = userId;
        cashFlowDb.is_active = false;
        await _cashFlowDao.Update(cashFlowDb);
    }

    private static void ValidateDirection(CashFlow cashFlow)
    {
        if (cashFlow.direction == "I" && cashFlow.@operator != 1)
        {
            throw new Exception("Income direction requires an operator of 1");
        }

        if (cashFlow.direction == "E" && cashFlow.@operator != -1)
        {
            throw new Exception("Expense direction requires an operator of -1");
        }
    }

    private async Task ValidateReferences(CashFlow cashFlow)
    {
        if (await _cashierMachineSessionDao.GetById(cashFlow.cashier_machine_session_id) is null)
        {
            throw new Exception("Cashier machine session not found");
        }

        if (cashFlow.tuua_sales_operation_id is not null &&
            await _tuuaSalesOperationDao.GetById(cashFlow.tuua_sales_operation_id.Value) is null)
        {
            throw new Exception("Tuua sales operation not found");
        }

        if (cashFlow.money_exchange_operation_id is not null &&
            await _moneyExchangeOperationDao.GetById(cashFlow.money_exchange_operation_id.Value) is null)
        {
            throw new Exception("Money exchange operation not found");
        }

        if (await _featureDao.GetFeatureById(cashFlow.payment_type_id) is null)
        {
            throw new Exception("Payment type not found");
        }

        if (await _featureDao.GetFeatureById(cashFlow.currency_id) is null)
        {
            throw new Exception("Currency not found");
        }
    }
}
