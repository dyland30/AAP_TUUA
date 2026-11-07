using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class CashierMachineSessionClosingBL
{
    private const string CurrencyGroupName = "Monedas";
    private const string PaymentTypeGroupName = "Tipos de Pago";
    private const string SessionStatusGroupName = "Estados Turno Caja";
    private const string OpenStatusName = "abierto";
    private const string ClosedStatusName = "cerrado";
    private const string CashPaymentName = "efectivo";
    private const string CashPaymentValue = "e";

    private readonly CashierMachineSessionClosingDao _closingDao;
    private readonly CashierMachineSessionDao _cashierMachineSessionDao;
    private readonly CashierMachineDao _cashierMachineDao;
    private readonly LocalUserDao _localUserDao;
    private readonly FeatureDao _featureDao;
    private readonly CashierMachineSessionCloseRequestValidator _closeRequestValidator;

    public CashierMachineSessionClosingBL(string cnx)
    {
        _closingDao = new CashierMachineSessionClosingDao(cnx);
        _cashierMachineSessionDao = new CashierMachineSessionDao(cnx);
        _cashierMachineDao = new CashierMachineDao(cnx);
        _localUserDao = new LocalUserDao(cnx);
        _featureDao = new FeatureDao(cnx);
        _closeRequestValidator = new CashierMachineSessionCloseRequestValidator();
    }

    public async Task<CashierMachineSessionClosing?> GetBySessionId(Guid cashierMachineSessionId)
    {
        return await _closingDao.GetBySessionId(cashierMachineSessionId);
    }

    // Turno abierto del usuario con los saldos esperados por moneda / tipo de pago y el origen de los movimientos.
    public async Task<CashierMachineSessionBalance> GetBalance(string? userId)
    {
        var session = await GetOpenSession(userId);
        var sessionId = session.id!.Value;
        var cashierMachine = await _cashierMachineDao.GetByCode(session.cashier_machine_code)
                             ?? throw new Exception($"Cashier machine {session.cashier_machine_code} not found");
        var localUser = await _localUserDao.GetById(session.local_user_id);
        var paymentTypes = await _featureDao.GetActiveByFeatureGroupName(PaymentTypeGroupName);
        var (salesCount, ticketsCount) = await _closingDao.GetSalesCounts(sessionId);

        return new CashierMachineSessionBalance
        {
            session = session,
            cashier_machine = cashierMachine,
            operator_name = localUser?.name ?? localUser?.email,
            currencies = await _featureDao.GetActiveByFeatureGroupName(CurrencyGroupName),
            payment_types = paymentTypes,
            cash_payment_type_id = FindCashPaymentType(paymentTypes).id,
            expected_amounts = await _closingDao.GetExpectedAmounts(sessionId),
            currency_totals = await _closingDao.GetCurrencyTotals(sessionId),
            sales_count = salesCount,
            tickets_count = ticketsCount
        };
    }

    // Registra el cuadre con los montos declarados y cierra el turno abierto del usuario.
    public async Task<CashierMachineSessionClosing> Close(CashierMachineSessionCloseRequest request, string? userId)
    {
        var result = await _closeRequestValidator.ValidateAsync(request);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        var session = await GetOpenSession(userId);
        if (session.id != request.cashier_machine_session_id)
        {
            throw new Exception("The cashier machine session is not the user's open session");
        }

        var duplicated = request.declared_amounts
            .GroupBy(d => (d.currency_id, d.payment_type_id))
            .Any(g => g.Count() > 1);
        if (duplicated)
        {
            throw new Exception("Each currency and payment type can be declared only once");
        }

        await ValidateDeclaredReferences(request.declared_amounts);

        var statuses = await _featureDao.GetActiveByFeatureGroupName(SessionStatusGroupName);
        var openStatus = FindFeature(statuses, OpenStatusName)
                         ?? throw new Exception($"Status '{OpenStatusName}' not found in '{SessionStatusGroupName}'");
        var closedStatus = FindFeature(statuses, ClosedStatusName)
                           ?? throw new Exception($"Status '{ClosedStatusName}' not found in '{SessionStatusGroupName}'");

        var observation = string.IsNullOrWhiteSpace(request.observation) ? null : request.observation.Trim();
        var now = DateTime.Now;

        return await _closingDao.Close(session.id!.Value, openStatus.id, closedStatus.id,
            expected => BuildClosing(session.id.Value, expected, request.declared_amounts, observation, userId, now));
    }

    // Cruza los saldos esperados con los declarados: toda combinación con saldo debe declararse, y una
    // diferencia exige una observación que la justifique.
    private static CashierMachineSessionClosing BuildClosing(Guid sessionId,
        List<CashierMachineSessionExpectedAmount> expectedAmounts,
        List<CashierMachineSessionDeclaredAmount> declaredAmounts, string? observation, string? userId, DateTime now)
    {
        var expected = expectedAmounts.ToDictionary(e => (e.currency_id, e.payment_type_id), e => e.expected_amount);
        var declared = declaredAmounts.ToDictionary(d => (d.currency_id, d.payment_type_id), d => d.declared_amount);

        var missing = expected.Where(e => e.Value != 0 && !declared.ContainsKey(e.Key)).ToList();
        if (missing.Count > 0)
        {
            throw new Exception("All currencies and payment types with a balance must be declared");
        }

        var details = expected.Keys.Union(declared.Keys)
            .OrderBy(k => k.currency_id).ThenBy(k => k.payment_type_id)
            .Select(key =>
            {
                var expectedAmount = expected.GetValueOrDefault(key);
                var declaredAmount = declared.GetValueOrDefault(key);
                return new CashierMachineSessionClosingDetail
                {
                    currency_id = key.currency_id,
                    payment_type_id = key.payment_type_id,
                    expected_amount = expectedAmount,
                    declared_amount = declaredAmount,
                    difference_amount = declaredAmount - expectedAmount,
                    created_at = now,
                    updated_at = now,
                    created_by = userId,
                    modified_by = userId
                };
            })
            .ToList();

        var hasDifference = details.Any(d => d.difference_amount != 0);
        if (hasDifference && observation is null)
        {
            throw new Exception("An observation is required when the declared amounts differ from the expected amounts");
        }

        return new CashierMachineSessionClosing
        {
            cashier_machine_session_id = sessionId,
            closing_date = now,
            has_difference = hasDifference,
            observation = observation,
            created_at = now,
            updated_at = now,
            created_by = userId,
            modified_by = userId,
            details = details
        };
    }

    private async Task ValidateDeclaredReferences(List<CashierMachineSessionDeclaredAmount> declaredAmounts)
    {
        var currencyIds = (await _featureDao.GetActiveByFeatureGroupName(CurrencyGroupName)).Select(f => f.id).ToHashSet();
        var paymentTypeIds = (await _featureDao.GetActiveByFeatureGroupName(PaymentTypeGroupName)).Select(f => f.id).ToHashSet();

        if (declaredAmounts.Any(d => !currencyIds.Contains(d.currency_id)))
        {
            throw new Exception("Currency not found");
        }

        if (declaredAmounts.Any(d => !paymentTypeIds.Contains(d.payment_type_id)))
        {
            throw new Exception("Payment type not found");
        }
    }

    private async Task<CashierMachineSession> GetOpenSession(string? userId)
    {
        if (!Guid.TryParse(userId, out var localUserId))
        {
            throw new Exception("Invalid user");
        }

        return await _cashierMachineSessionDao.GetOpenByLocalUserId(localUserId)
               ?? throw new Exception("The user has no open cashier machine session");
    }

    private static Feature FindCashPaymentType(List<Feature> paymentTypes)
    {
        return paymentTypes.FirstOrDefault(p => p.feature_value?.Trim().ToLower() == CashPaymentValue)
               ?? FindFeature(paymentTypes, CashPaymentName)
               ?? throw new Exception($"Cash payment type '{CashPaymentName}' not found in '{PaymentTypeGroupName}'");
    }

    private static Feature? FindFeature(List<Feature> features, string name)
    {
        return features.FirstOrDefault(f =>
            f.description?.Trim().ToLower() == name || f.feature_value?.Trim().ToLower() == name);
    }
}
