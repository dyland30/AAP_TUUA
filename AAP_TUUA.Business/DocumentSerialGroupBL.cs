using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class DocumentSerialGroupBL
{
    private readonly DocumentSerialGroupDao _documentSerialGroupDao;
    private readonly FeatureDao _featureDao;
    private readonly CashierMachineDao _cashierMachineDao;
    private readonly TerminalDao _terminalDao;
    private readonly LocationDao _locationDao;
    private readonly DocumentSerialGroupValidator _documentSerialGroupValidator;

    public DocumentSerialGroupBL(string cnx)
    {
        _documentSerialGroupDao = new DocumentSerialGroupDao(cnx);
        _featureDao = new FeatureDao(cnx);
        _cashierMachineDao = new CashierMachineDao(cnx);
        _terminalDao = new TerminalDao(cnx);
        _locationDao = new LocationDao(cnx);
        _documentSerialGroupValidator = new DocumentSerialGroupValidator();
    }

    public async Task<IEnumerable<DocumentSerialGroup>?> GetAll()
    {
        return await _documentSerialGroupDao.GetAll();
    }

    public async Task<DocumentSerialGroup?> GetById(Guid id)
    {
        return await _documentSerialGroupDao.GetById(id);
    }

    public async Task<DocumentSerialGroup> Add(DocumentSerialGroup group, string? userId)
    {
        var result = await _documentSerialGroupValidator.ValidateAsync(group);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        await ValidateReferences(group);

        var now = DateTime.Now;
        group.created_at = now;
        group.updated_at = now;
        group.created_by = userId;
        group.modified_by = userId;
        group.is_active = true;

        PrepareDetails(group, now, userId);

        return await _documentSerialGroupDao.Add(group);
    }

    public async Task<DocumentSerialGroup> Update(DocumentSerialGroup group, string? userId)
    {
        var result = await _documentSerialGroupValidator.ValidateAsync(group);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        if (group.id is null)
        {
            throw new Exception("Document serial group id is required");
        }

        var groupDb = await _documentSerialGroupDao.GetById(group.id.Value);
        if (groupDb is null)
        {
            throw new Exception("Document serial group not found");
        }

        await ValidateReferences(group);

        var now = DateTime.Now;
        group.created_at = groupDb.created_at;
        group.created_by = groupDb.created_by;
        group.updated_at = now;
        group.modified_by = userId;

        PrepareDetails(group, now, userId);

        await _documentSerialGroupDao.Update(group);

        return group;
    }

    public async Task Delete(Guid id, string? userId)
    {
        var groupDb = await _documentSerialGroupDao.GetById(id);
        if (groupDb is null)
        {
            throw new Exception("Document serial group not found");
        }

        groupDb.updated_at = DateTime.Now;
        groupDb.modified_by = userId;
        groupDb.is_active = false;
        await _documentSerialGroupDao.SoftDelete(groupDb);
    }

    private async Task ValidateReferences(DocumentSerialGroup group)
    {
        if (await _featureDao.GetFeatureById(group.document_type_id!.Value) is null)
        {
            throw new Exception("Document type not found");
        }

        if (await _featureDao.GetFeatureById(group.seae_type_id!.Value) is null)
        {
            throw new Exception("SeaE type not found");
        }

        if (await _featureDao.GetFeatureById(group.sale_type_id!.Value) is null)
        {
            throw new Exception("Sale type not found");
        }

        if (group.terminal_id is not null && await _terminalDao.GetById(group.terminal_id.Value) is null)
        {
            throw new Exception("Terminal not found");
        }

        if (group.location_id is not null && await _locationDao.GetById(group.location_id.Value) is null)
        {
            throw new Exception("Location not found");
        }

        if (group.sequential_numbers is not null)
        {
            foreach (var detail in group.sequential_numbers)
            {
                if (await _cashierMachineDao.GetByCode(detail.cashier_code!) is null)
                {
                    throw new Exception("Cashier machine not found");
                }
            }
        }
    }

    private static void PrepareDetails(DocumentSerialGroup group, DateTime now, string? userId)
    {
        if (group.sequential_numbers is null)
        {
            return;
        }

        foreach (var detail in group.sequential_numbers)
        {
            detail.id = null;
            detail.document_serial_group_id = group.id;
            detail.created_at = now;
            detail.updated_at = now;
            detail.created_by = userId;
            detail.modified_by = userId;
            detail.is_active = true;
        }
    }
}
