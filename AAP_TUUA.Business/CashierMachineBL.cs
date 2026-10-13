using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class CashierMachineBL
{
    private readonly CashierMachineDao _cashierMachineDao;
    private readonly TerminalDao _terminalDao;
    private readonly AirportDao _airportDao;
    private readonly LocationDao _locationDao;
    private readonly CashierMachineValidator _cashierMachineValidator;

    public CashierMachineBL(string cnx)
    {
        _cashierMachineDao = new CashierMachineDao(cnx);
        _terminalDao = new TerminalDao(cnx);
        _airportDao = new AirportDao(cnx);
        _locationDao = new LocationDao(cnx);
        _cashierMachineValidator = new CashierMachineValidator();
    }

    public async Task<IEnumerable<CashierMachine>?> GetAll()
    {
        return await _cashierMachineDao.GetAll();
    }

    public async Task<CashierMachine?> GetByCode(string code)
    {
        return await _cashierMachineDao.GetByCode(code);
    }

    public async Task<CashierMachine> Add(CashierMachine cashierMachine, string? userId)
    {
        var result = await _cashierMachineValidator.ValidateAsync(cashierMachine);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        await ValidateReferences(cashierMachine);

        cashierMachine.code = await GenerateCode(cashierMachine.terminal_id!.Value);
        cashierMachine.created_at = DateTime.Now;
        cashierMachine.updated_at = DateTime.Now;
        cashierMachine.created_by = userId;
        cashierMachine.modified_by = userId;
        cashierMachine.is_active = true;

        return await _cashierMachineDao.Add(cashierMachine);
    }

    public async Task<CashierMachine> Update(CashierMachine cashierMachine, string? userId)
    {
        var result = await _cashierMachineValidator.ValidateAsync(cashierMachine);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        if (string.IsNullOrWhiteSpace(cashierMachine.code))
        {
            throw new Exception("Cashier machine code is required");
        }

        var cashierMachineDb = await _cashierMachineDao.GetByCode(cashierMachine.code);
        if (cashierMachineDb is null)
        {
            throw new Exception("Cashier machine not found");
        }

        await ValidateReferences(cashierMachine);

        cashierMachine.created_at = cashierMachineDb.created_at;
        cashierMachine.created_by = cashierMachineDb.created_by;
        cashierMachine.updated_at = DateTime.Now;
        cashierMachine.modified_by = userId;
        await _cashierMachineDao.Update(cashierMachine);

        return cashierMachine;
    }

    public async Task Delete(string code, string? userId)
    {
        var cashierMachineDb = await _cashierMachineDao.GetByCode(code);
        if (cashierMachineDb is null)
        {
            throw new Exception("Cashier machine not found");
        }

        cashierMachineDb.updated_at = DateTime.Now;
        cashierMachineDb.modified_by = userId;
        cashierMachineDb.is_active = false;
        await _cashierMachineDao.Update(cashierMachineDb);
    }

    private async Task ValidateReferences(CashierMachine cashierMachine)
    {
        if (await _terminalDao.GetById(cashierMachine.terminal_id!.Value) is null)
        {
            throw new Exception("Terminal not found");
        }

        if (cashierMachine.location_id is not null &&
            await _locationDao.GetById(cashierMachine.location_id.Value) is null)
        {
            throw new Exception("Location not found");
        }
    }

    // El código se forma como 'CAJA-' + upper(airport.iata_code o '000') + '-' + upper(trim(terminal.name o '00')) + '-' + secuencial de 4 dígitos.
    private async Task<string> GenerateCode(Guid terminalId)
    {
        var terminal = await _terminalDao.GetById(terminalId);
        if (terminal is null)
        {
            throw new Exception("Terminal not found");
        }

        if (terminal.airport_id is null || terminal.airport_id == Guid.Empty)
        {
            throw new Exception("Terminal has no airport assigned");
        }

        var airport = await _airportDao.GetById(terminal.airport_id.Value);
        if (airport is null)
        {
            throw new Exception("Airport not found");
        }

        var iata = (airport.iata_code ?? string.Empty).Trim().ToUpperInvariant();
        if (iata.Length == 0)
        {
            iata = "000";
        }

        var terminalName = (terminal.name ?? string.Empty).Trim().ToUpperInvariant();
        if (terminalName.Length == 0)
        {
            terminalName = "00";
        }

        var prefix = $"CAJA-{iata}-{terminalName}-";

        var codes = await _cashierMachineDao.GetCodesByPrefix(prefix);
        var next = 1;
        foreach (var code in codes)
        {
            if (code.Length > prefix.Length && int.TryParse(code[prefix.Length..], out var sequence) && sequence >= next)
            {
                next = sequence + 1;
            }
        }

        return $"{prefix}{next:D4}";
    }
}
