using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class TuuaGateBL
{
    private readonly TuuaGateDao _tuuaGateDao;
    private readonly TerminalDao _terminalDao;
    private readonly AirportDao _airportDao;
    private readonly FeatureDao _featureDao;
    private readonly TuuaGateValidator _tuuaGateValidator;

    public TuuaGateBL(string cnx)
    {
        _tuuaGateDao = new TuuaGateDao(cnx);
        _terminalDao = new TerminalDao(cnx);
        _airportDao = new AirportDao(cnx);
        _featureDao = new FeatureDao(cnx);
        _tuuaGateValidator = new TuuaGateValidator();
    }

    public async Task<IEnumerable<TuuaGate>?> GetAll()
    {
        return await _tuuaGateDao.GetAll();
    }

    public async Task<TuuaGate?> GetByCode(string code)
    {
        return await _tuuaGateDao.GetByCode(code);
    }

    public async Task<IEnumerable<TuuaGate>?> GetByTerminalId(Guid terminalId)
    {
        return await _tuuaGateDao.GetByTerminalId(terminalId);
    }

    public async Task<TuuaGate> Add(TuuaGate tuuaGate, string? userId)
    {
        var result = await _tuuaGateValidator.ValidateAsync(tuuaGate);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        await ValidateReferences(tuuaGate);

        tuuaGate.code = await GenerateCode(tuuaGate.terminal_id!.Value);
        tuuaGate.created_at = DateTime.Now;
        tuuaGate.updated_at = DateTime.Now;
        tuuaGate.created_by = userId;
        tuuaGate.modified_by = userId;
        tuuaGate.is_active = true;

        return await _tuuaGateDao.Add(tuuaGate);
    }

    public async Task<TuuaGate> Update(TuuaGate tuuaGate, string? userId)
    {
        var result = await _tuuaGateValidator.ValidateAsync(tuuaGate);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        if (string.IsNullOrWhiteSpace(tuuaGate.code))
        {
            throw new Exception("Tuua gate code is required");
        }

        var tuuaGateDb = await _tuuaGateDao.GetByCode(tuuaGate.code);
        if (tuuaGateDb is null)
        {
            throw new Exception("Tuua gate not found");
        }

        await ValidateReferences(tuuaGate);

        tuuaGate.created_at = tuuaGateDb.created_at;
        tuuaGate.created_by = tuuaGateDb.created_by;
        tuuaGate.updated_at = DateTime.Now;
        tuuaGate.modified_by = userId;
        await _tuuaGateDao.Update(tuuaGate);

        return tuuaGate;
    }

    public async Task Delete(string code, string? userId)
    {
        var tuuaGateDb = await _tuuaGateDao.GetByCode(code);
        if (tuuaGateDb is null)
        {
            throw new Exception("Tuua gate not found");
        }

        tuuaGateDb.updated_at = DateTime.Now;
        tuuaGateDb.modified_by = userId;
        tuuaGateDb.is_active = false;
        await _tuuaGateDao.Update(tuuaGateDb);
    }

    private async Task ValidateReferences(TuuaGate tuuaGate)
    {
        if (await _terminalDao.GetById(tuuaGate.terminal_id!.Value) is null)
        {
            throw new Exception("Terminal not found");
        }

        if (await _featureDao.GetFeatureById(tuuaGate.flight_type_id!.Value) is null)
        {
            throw new Exception("Flight type not found");
        }

        if (await _featureDao.GetFeatureById(tuuaGate.tuua_gate_type_id!.Value) is null)
        {
            throw new Exception("Tuua gate type not found");
        }
    }

    // El código se forma como upper(airport.iata_code) + "-" + upper(trim(terminal.name)) + "-" + secuencial de 4 dígitos.
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
        var terminalName = (terminal.name ?? string.Empty).Trim().ToUpperInvariant();
        var prefix = $"{iata}-{terminalName}-";

        var codes = await _tuuaGateDao.GetCodesByPrefix(prefix);
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
