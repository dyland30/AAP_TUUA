using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class LocalUserCashierMachineBL
{
    private readonly LocalUserCashierMachineDao _localUserCashierMachineDao;
    private readonly LocalUserDao _localUserDao;
    private readonly CashierMachineDao _cashierMachineDao;
    private readonly LocalUserCashierMachineValidator _localUserCashierMachineValidator;

    public LocalUserCashierMachineBL(string cnx)
    {
        _localUserCashierMachineDao = new LocalUserCashierMachineDao(cnx);
        _localUserDao = new LocalUserDao(cnx);
        _cashierMachineDao = new CashierMachineDao(cnx);
        _localUserCashierMachineValidator = new LocalUserCashierMachineValidator();
    }

    public async Task<IEnumerable<LocalUserCashierMachine>?> GetAll()
    {
        return await _localUserCashierMachineDao.GetAll();
    }

    public async Task<IEnumerable<LocalUserCashierMachine>?> GetByLocalUserId(Guid localUserId)
    {
        return await _localUserCashierMachineDao.GetByLocalUserId(localUserId);
    }

    public async Task<IEnumerable<LocalUserCashierMachine>?> GetByCashierMachineCode(string cashierMachineCode)
    {
        return await _localUserCashierMachineDao.GetByCashierMachineCode(cashierMachineCode);
    }

    public async Task<LocalUserCashierMachine> Add(LocalUserCashierMachine assignment, string? userId)
    {
        var result = await _localUserCashierMachineValidator.ValidateAsync(assignment);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        if (await _localUserDao.GetById(assignment.local_user_id) is null)
        {
            throw new Exception("Local user not found");
        }

        if (await _cashierMachineDao.GetByCode(assignment.cashier_machine_code) is null)
        {
            throw new Exception("Cashier machine not found");
        }

        if (await _localUserCashierMachineDao.Get(assignment.local_user_id, assignment.cashier_machine_code) is not null)
        {
            throw new Exception("The cashier machine is already assigned to the local user");
        }

        assignment.created_at = DateTime.Now;
        assignment.updated_at = DateTime.Now;
        assignment.created_by = userId;
        assignment.modified_by = userId;

        return await _localUserCashierMachineDao.Add(assignment);
    }

    public async Task Delete(Guid localUserId, string cashierMachineCode)
    {
        var assignment = await _localUserCashierMachineDao.Get(localUserId, cashierMachineCode);
        if (assignment is null)
        {
            throw new Exception("Local user cashier machine assignment not found");
        }

        await _localUserCashierMachineDao.Delete(localUserId, cashierMachineCode);
    }
}
