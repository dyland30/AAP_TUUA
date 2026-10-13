using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class DocumentSequentialNumberBL
{
    private readonly DocumentSequentialNumberDao _documentSequentialNumberDao;
    private readonly DocumentSerialGroupDao _documentSerialGroupDao;
    private readonly CashierMachineDao _cashierMachineDao;
    private readonly DocumentSequentialNumberValidator _documentSequentialNumberValidator;

    public DocumentSequentialNumberBL(string cnx)
    {
        _documentSequentialNumberDao = new DocumentSequentialNumberDao(cnx);
        _documentSerialGroupDao = new DocumentSerialGroupDao(cnx);
        _cashierMachineDao = new CashierMachineDao(cnx);
        _documentSequentialNumberValidator = new DocumentSequentialNumberValidator();
    }

    public async Task<IEnumerable<DocumentSequentialNumber>?> GetByGroupId(Guid documentSerialGroupId)
    {
        return await _documentSequentialNumberDao.GetByGroupId(documentSerialGroupId);
    }

    public async Task<DocumentSequentialNumber?> GetById(Guid id)
    {
        return await _documentSequentialNumberDao.GetById(id);
    }

    public async Task<DocumentSequentialNumber> Add(DocumentSequentialNumber number, string? userId)
    {
        var result = await _documentSequentialNumberValidator.ValidateAsync(number);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        if (await _documentSerialGroupDao.GetById(number.document_serial_group_id!.Value) is null)
        {
            throw new Exception("Document serial group not found");
        }

        if (await _cashierMachineDao.GetByCode(number.cashier_code!) is null)
        {
            throw new Exception("Cashier machine not found");
        }

        number.created_at = DateTime.Now;
        number.updated_at = DateTime.Now;
        number.created_by = userId;
        number.modified_by = userId;
        number.is_active = true;

        return await _documentSequentialNumberDao.Add(number);
    }

    public async Task<DocumentSequentialNumber> Update(DocumentSequentialNumber number, string? userId)
    {
        var result = await _documentSequentialNumberValidator.ValidateAsync(number);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        if (number.id is null)
        {
            throw new Exception("Document sequential number id is required");
        }

        var numberDb = await _documentSequentialNumberDao.GetById(number.id.Value);
        if (numberDb is null)
        {
            throw new Exception("Document sequential number not found");
        }

        if (await _cashierMachineDao.GetByCode(number.cashier_code!) is null)
        {
            throw new Exception("Cashier machine not found");
        }

        number.created_at = numberDb.created_at;
        number.created_by = numberDb.created_by;
        number.updated_at = DateTime.Now;
        number.modified_by = userId;
        await _documentSequentialNumberDao.Update(number);

        return number;
    }

    public async Task Delete(Guid id)
    {
        var numberDb = await _documentSequentialNumberDao.GetById(id);
        if (numberDb is null)
        {
            throw new Exception("Document sequential number not found");
        }

        await _documentSequentialNumberDao.Delete(id);
    }
}
