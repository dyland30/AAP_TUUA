using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class TuuaTicketBL
{
    private readonly TuuaTicketDao _tuuaTicketDao;
    private readonly TuuaSalesOperationDao _tuuaSalesOperationDao;
    private readonly DocumentSequentialNumberDao _documentSequentialNumberDao;
    private readonly TuuaGateDao _tuuaGateDao;
    private readonly FeatureDao _featureDao;
    private readonly TuuaTicketValidator _tuuaTicketValidator;

    public TuuaTicketBL(string cnx)
    {
        _tuuaTicketDao = new TuuaTicketDao(cnx);
        _tuuaSalesOperationDao = new TuuaSalesOperationDao(cnx);
        _documentSequentialNumberDao = new DocumentSequentialNumberDao(cnx);
        _tuuaGateDao = new TuuaGateDao(cnx);
        _featureDao = new FeatureDao(cnx);
        _tuuaTicketValidator = new TuuaTicketValidator();
    }

    public async Task<TuuaTicket?> GetById(Guid id)
    {
        return await _tuuaTicketDao.GetById(id);
    }

    // GetByHash
    public async Task<TuuaTicket?> GetByHash(string hash)
    {
        return await _tuuaTicketDao.GetByHash(hash);
    }
    
    //GetTerminalIdbyTicketId
    public async Task<Guid?> GetTerminalIdbyTicketId(Guid id)
    {
        return await _tuuaTicketDao.GetTerminalIdbyTicketId(id);
    }
    
    
    public async Task<IEnumerable<TuuaTicket>?> GetBySalesOperationId(Guid tuuaSalesOperationId)
    {
        return await _tuuaTicketDao.GetBySalesOperationId(tuuaSalesOperationId);
    }

    public async Task<IEnumerable<TuuaTicket>?> GetByDocumentSequentialNumbersId(Guid documentSequentialNumbersId)
    {
        return await _tuuaTicketDao.GetByDocumentSequentialNumbersId(documentSequentialNumbersId);
    }

    public async Task<TuuaTicket?> GetBySerialAndSequentialNumber(string serial, long sequentialNumber)
    {
        return await _tuuaTicketDao.GetBySerialAndSequentialNumber(serial, sequentialNumber);
    }

    public async Task<TuuaTicket> Add(TuuaTicket ticket, string? userId)
    {
        var result = await _tuuaTicketValidator.ValidateAsync(ticket);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        await ValidateReferences(ticket);

        ticket.created_at = DateTime.Now;
        ticket.updated_at = DateTime.Now;
        ticket.created_by = userId;
        ticket.modified_by = userId;

        return await _tuuaTicketDao.Add(ticket);
    }

    public async Task<TuuaTicket> Update(TuuaTicket ticket, string? userId)
    {
        var result = await _tuuaTicketValidator.ValidateAsync(ticket);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        if (ticket.id is null || ticket.id == Guid.Empty)
        {
            throw new Exception("Tuua ticket id is required");
        }

        var ticketDb = await _tuuaTicketDao.GetById(ticket.id.Value);
        if (ticketDb is null)
        {
            throw new Exception("Tuua ticket not found");
        }

        await ValidateReferences(ticket);

        ticket.created_at = ticketDb.created_at;
        ticket.created_by = ticketDb.created_by;
        ticket.updated_at = DateTime.Now;
        ticket.modified_by = userId;
        await _tuuaTicketDao.Update(ticket);

        return ticket;
    }

    public async Task Delete(Guid id)
    {
        var ticketDb = await _tuuaTicketDao.GetById(id);
        if (ticketDb is null)
        {
            throw new Exception("Tuua ticket not found");
        }

        await _tuuaTicketDao.Delete(id);
    }

    private async Task ValidateReferences(TuuaTicket ticket)
    {
        if (await _documentSequentialNumberDao.GetById(ticket.document_sequential_numbers_id) is null)
        {
            throw new Exception("Document sequential number not found");
        }

        if (!string.IsNullOrWhiteSpace(ticket.tuua_gate_code) &&
            await _tuuaGateDao.GetByCode(ticket.tuua_gate_code) is null)
        {
            throw new Exception("Tuua gate not found");
        }

        if (await _featureDao.GetFeatureById(ticket.status_id) is null)
        {
            throw new Exception("Tuua ticket status not found");
        }

        if (ticket.tuua_sales_operation_id is not null &&
            await _tuuaSalesOperationDao.GetById(ticket.tuua_sales_operation_id.Value) is null)
        {
            throw new Exception("Tuua sales operation not found");
        }
    }
}
