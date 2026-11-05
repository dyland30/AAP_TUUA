using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class MoneyExchangeOperationBL
{
    private const string PaymentTypeGroupName = "Tipos de Pago";
    private const string CashPaymentName = "Efectivo";

    private readonly MoneyExchangeOperationDao _moneyExchangeOperationDao;
    private readonly CashierMachineSessionDao _cashierMachineSessionDao;
    private readonly ExchangeRateDao _exchangeRateDao;
    private readonly FeatureDao _featureDao;
    private readonly MoneyExchangeOperationValidator _moneyExchangeOperationValidator;

    public MoneyExchangeOperationBL(string cnx)
    {
        _moneyExchangeOperationDao = new MoneyExchangeOperationDao(cnx);
        _cashierMachineSessionDao = new CashierMachineSessionDao(cnx);
        _exchangeRateDao = new ExchangeRateDao(cnx);
        _featureDao = new FeatureDao(cnx);
        _moneyExchangeOperationValidator = new MoneyExchangeOperationValidator();
    }

    public async Task<IEnumerable<MoneyExchangeOperation>?> GetAll()
    {
        return await _moneyExchangeOperationDao.GetAll();
    }

    public async Task<MoneyExchangeOperation?> GetById(Guid id)
    {
        return await _moneyExchangeOperationDao.GetById(id);
    }

    public async Task<IEnumerable<MoneyExchangeOperation>?> GetByCashierMachineSessionId(Guid cashierMachineSessionId)
    {
        return await _moneyExchangeOperationDao.GetByCashierMachineSessionId(cashierMachineSessionId);
    }

    public async Task<IEnumerable<MoneyExchangeOperation>?> GetByExchangeRateId(Guid exchangeRateId)
    {
        return await _moneyExchangeOperationDao.GetByExchangeRateId(exchangeRateId);
    }

    public async Task<MoneyExchangeOperation> Add(MoneyExchangeOperation moneyExchangeOperation, string? userId)
    {
        var result = await _moneyExchangeOperationValidator.ValidateAsync(moneyExchangeOperation);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        await ValidateReferences(moneyExchangeOperation);

        var cashPaymentTypeId = await GetCashPaymentTypeId();
        var now = DateTime.Now;

        moneyExchangeOperation.created_at = now;
        moneyExchangeOperation.updated_at = now;
        moneyExchangeOperation.created_by = userId;
        moneyExchangeOperation.modified_by = userId;

        var cashFlows = BuildCashFlows(moneyExchangeOperation, cashPaymentTypeId, userId, now);

        return await _moneyExchangeOperationDao.Add(moneyExchangeOperation, cashFlows);
    }

    public async Task<MoneyExchangeOperation> Update(MoneyExchangeOperation moneyExchangeOperation, string? userId)
    {
        var result = await _moneyExchangeOperationValidator.ValidateAsync(moneyExchangeOperation);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        if (moneyExchangeOperation.id is null || moneyExchangeOperation.id == Guid.Empty)
        {
            throw new Exception("Money exchange operation id is required");
        }

        var moneyExchangeOperationDb = await _moneyExchangeOperationDao.GetById(moneyExchangeOperation.id.Value);
        if (moneyExchangeOperationDb is null)
        {
            throw new Exception("Money exchange operation not found");
        }

        await ValidateReferences(moneyExchangeOperation);

        moneyExchangeOperation.created_at = moneyExchangeOperationDb.created_at;
        moneyExchangeOperation.created_by = moneyExchangeOperationDb.created_by;
        moneyExchangeOperation.updated_at = DateTime.Now;
        moneyExchangeOperation.modified_by = userId;
        await _moneyExchangeOperationDao.Update(moneyExchangeOperation);

        return moneyExchangeOperation;
    }

    public async Task Delete(Guid id)
    {
        var moneyExchangeOperationDb = await _moneyExchangeOperationDao.GetById(id);
        if (moneyExchangeOperationDb is null)
        {
            throw new Exception("Money exchange operation not found");
        }

        await _moneyExchangeOperationDao.Delete(id);
    }

    private async Task ValidateReferences(MoneyExchangeOperation moneyExchangeOperation)
    {
        if (await _cashierMachineSessionDao.GetById(moneyExchangeOperation.cashier_machine_session_id) is null)
        {
            throw new Exception("Cashier machine session not found");
        }

        if (await _featureDao.GetFeatureById(moneyExchangeOperation.local_currency_id) is null)
        {
            throw new Exception("Local currency not found");
        }

        if (await _featureDao.GetFeatureById(moneyExchangeOperation.foreign_currency_id) is null)
        {
            throw new Exception("Foreign currency not found");
        }

        if (await _exchangeRateDao.GetById(moneyExchangeOperation.exchange_rate_id) is null)
        {
            throw new Exception("Exchange rate not found");
        }
    }

    private async Task<int> GetCashPaymentTypeId()
    {
        var groupId = await _featureDao.GetFeatureGroupIdByName(PaymentTypeGroupName);
        if (groupId is null)
        {
            throw new Exception($"Payment type group '{PaymentTypeGroupName}' not found");
        }

        var cashPaymentTypes = await _featureDao.GetByFeatureGroupAndDescription(groupId.Value, CashPaymentName);
        var cashPaymentType = cashPaymentTypes?.FirstOrDefault();
        if (cashPaymentType is null)
        {
            throw new Exception($"Cash payment type '{CashPaymentName}' not found");
        }

        return cashPaymentType.id;
    }

    private static List<CashFlow> BuildCashFlows(MoneyExchangeOperation moneyExchangeOperation,
        int paymentTypeId, string? userId, DateTime now)
    {
        var isPurchase = moneyExchangeOperation.operation_type == "P";

        return new List<CashFlow>
        {
            BuildCashFlow(moneyExchangeOperation, moneyExchangeOperation.local_currency_id,
                moneyExchangeOperation.local_currency_amount, isPurchase ? "E" : "I",
                paymentTypeId, userId, now),
            BuildCashFlow(moneyExchangeOperation, moneyExchangeOperation.foreign_currency_id,
                moneyExchangeOperation.foreign_currency_amount, isPurchase ? "I" : "E",
                paymentTypeId, userId, now)
        };
    }

    private static CashFlow BuildCashFlow(MoneyExchangeOperation moneyExchangeOperation, int currencyId,
        decimal amount, string direction, int paymentTypeId, string? userId, DateTime now)
    {
        return new CashFlow
        {
            cashier_machine_session_id = moneyExchangeOperation.cashier_machine_session_id,
            direction = direction,
            @operator = direction == "I" ? (short)1 : (short)-1,
            payment_type_id = paymentTypeId,
            currency_id = currencyId,
            amount = amount,
            is_active = true,
            created_at = now,
            updated_at = now,
            created_by = userId,
            modified_by = userId
        };
    }
}
