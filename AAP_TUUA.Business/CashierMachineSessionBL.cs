using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class CashierMachineSessionBL
{
    private readonly CashierMachineSessionDao _cashierMachineSessionDao;
    private readonly CashierMachineDao _cashierMachineDao;
    private readonly LocalUserDao _localUserDao;
    private readonly FeatureDao _featureDao;
    private readonly CashierMachineSessionValidator _cashierMachineSessionValidator;

    public CashierMachineSessionBL(string cnx)
    {
        _cashierMachineSessionDao = new CashierMachineSessionDao(cnx);
        _cashierMachineDao = new CashierMachineDao(cnx);
        _localUserDao = new LocalUserDao(cnx);
        _featureDao = new FeatureDao(cnx);
        _cashierMachineSessionValidator = new CashierMachineSessionValidator();
    }

    public async Task<IEnumerable<CashierMachineSession>?> GetAll()
    {
        return await _cashierMachineSessionDao.GetAll();
    }

    public async Task<CashierMachineSession?> GetById(Guid id)
    {
        return await _cashierMachineSessionDao.GetById(id);
    }

    public async Task<CashierMachineSession?> GetOpenByCashierMachineCode(string cashierMachineCode)
    {
        return await _cashierMachineSessionDao.GetOpenByCashierMachineCode(cashierMachineCode);
    }

    public async Task<IEnumerable<CashierMachineSession>?> GetByLocalUserId(Guid localUserId)
    {
        return await _cashierMachineSessionDao.GetByLocalUserId(localUserId);
    }

    public async Task<CashierMachineSession> Add(CashierMachineSession session, string? userId)
    {
        var result = await _cashierMachineSessionValidator.ValidateAsync(session);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        await ValidateReferences(session);

        session.created_at = DateTime.Now;
        session.updated_at = DateTime.Now;
        session.created_by = userId;
        session.modified_by = userId;
        session.is_active = true;

        return await _cashierMachineSessionDao.Add(session);
    }

    public async Task<CashierMachineSession> Update(CashierMachineSession session, string? userId)
    {
        var result = await _cashierMachineSessionValidator.ValidateAsync(session);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        if (session.id is null || session.id == Guid.Empty)
        {
            throw new Exception("Cashier machine session id is required");
        }

        var sessionDb = await _cashierMachineSessionDao.GetById(session.id.Value);
        if (sessionDb is null)
        {
            throw new Exception("Cashier machine session not found");
        }

        await ValidateReferences(session);

        session.created_at = sessionDb.created_at;
        session.created_by = sessionDb.created_by;
        session.updated_at = DateTime.Now;
        session.modified_by = userId;
        await _cashierMachineSessionDao.Update(session);

        return session;
    }

    public async Task Delete(Guid id, string? userId)
    {
        var sessionDb = await _cashierMachineSessionDao.GetById(id);
        if (sessionDb is null)
        {
            throw new Exception("Cashier machine session not found");
        }

        sessionDb.updated_at = DateTime.Now;
        sessionDb.modified_by = userId;
        sessionDb.is_active = false;
        await _cashierMachineSessionDao.Update(sessionDb);
    }

    private async Task ValidateReferences(CashierMachineSession session)
    {
        if (await _cashierMachineDao.GetByCode(session.cashier_machine_code) is null)
        {
            throw new Exception("Cashier machine not found");
        }

        if (await _localUserDao.GetById(session.local_user_id) is null)
        {
            throw new Exception("Local user not found");
        }

        if (await _featureDao.GetFeatureById(session.status_id) is null)
        {
            throw new Exception("Cashier machine session status not found");
        }
    }
}
