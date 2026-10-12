using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class TerminalBL
{
    private readonly TerminalDao _terminalDao;
    private readonly AirportDao _airportDao;
    private readonly LocationDao _locationDao;
    private readonly TerminalValidator _terminalValidator;

    public TerminalBL(string cnx)
    {
        _terminalDao = new TerminalDao(cnx);
        _airportDao = new AirportDao(cnx);
        _locationDao = new LocationDao(cnx);
        _terminalValidator = new TerminalValidator();
    }

    public async Task<IEnumerable<Terminal>?> GetAll()
    {
        return await _terminalDao.GetAll();
    }

    public async Task<Terminal?> GetById(Guid id)
    {
        return await _terminalDao.GetById(id);
    }

    public async Task<IEnumerable<Terminal>?> GetByAirportId(Guid airportId)
    {
        return await _terminalDao.GetByAirportId(airportId);
    }

    public async Task<Terminal> Add(Terminal terminal, string? userId)
    {
        var result = await _terminalValidator.ValidateAsync(terminal);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        if (await _airportDao.GetById(terminal.airport_id!.Value) is null)
        {
            throw new Exception("Airport not found");
        }

        if (terminal.location_id.HasValue && await _locationDao.GetById(terminal.location_id.Value) is null)
        {
            throw new Exception("Location not found");
        }

        terminal.created_at = DateTime.Now;
        terminal.updated_at = DateTime.Now;
        terminal.created_by = userId;
        terminal.modified_by = userId;
        terminal.is_active = true;

        return await _terminalDao.Add(terminal);
    }

    public async Task<Terminal> Update(Terminal terminal, string? userId)
    {
        var result = await _terminalValidator.ValidateAsync(terminal);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        if (terminal.id == null || terminal.id == Guid.Empty)
        {
            throw new Exception("Terminal id is required");
        }

        var terminalDb = await _terminalDao.GetById(terminal.id.Value);
        if (terminalDb is null)
        {
            throw new Exception("Terminal not found");
        }

        if (await _airportDao.GetById(terminal.airport_id!.Value) is null)
        {
            throw new Exception("Airport not found");
        }

        if (terminal.location_id.HasValue && await _locationDao.GetById(terminal.location_id.Value) is null)
        {
            throw new Exception("Location not found");
        }

        terminal.created_at = terminalDb.created_at;
        terminal.created_by = terminalDb.created_by;
        terminal.updated_at = DateTime.Now;
        terminal.modified_by = userId;
        await _terminalDao.Update(terminal);

        return terminal;
    }

    public async Task Delete(Guid id, string? userId)
    {
        var terminalDb = await _terminalDao.GetById(id);
        if (terminalDb is null)
        {
            throw new Exception("Terminal not found");
        }

        terminalDb.updated_at = DateTime.Now;
        terminalDb.modified_by = userId;
        terminalDb.is_active = false;
        await _terminalDao.Update(terminalDb);
    }
}
