using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class CompanyBL
{
    private readonly CompanyDao _companyDao;
    private readonly CompanyValidator _companyValidator;

    public CompanyBL(string cnx)
    {
        _companyDao = new CompanyDao(cnx);
        _companyValidator = new CompanyValidator();
    }

    public async Task<IEnumerable<Company>?> GetAll()
    {
        return await _companyDao.GetAll();
    }

    public async Task<Company?> GetById(Guid id)
    {
        return await _companyDao.GetById(id);
    }

    public async Task<Company> Add(Company company, string? userId)
    {
        var result = await _companyValidator.ValidateAsync(company);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        company.created_at = DateTime.Now;
        company.updated_at = DateTime.Now;
        company.created_by = userId;
        company.modified_by = userId;

        return await _companyDao.Add(company);
    }

    public async Task<Company> Update(Company company, string? userId)
    {
        var result = await _companyValidator.ValidateAsync(company);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        if (company.id == null || company.id == Guid.Empty)
        {
            throw new Exception("Company id is required");
        }

        var companyDb = await _companyDao.GetById(company.id.Value);
        if (companyDb is null)
        {
            throw new Exception("Company not found");
        }

        company.created_at = companyDb.created_at;
        company.created_by = companyDb.created_by;
        company.updated_at = DateTime.Now;
        company.modified_by = userId;
        await _companyDao.Update(company);

        return company;
    }

    public async Task Delete(Guid id, string? userId)
    {
        var companyDb = await _companyDao.GetById(id);
        if (companyDb is null)
        {
            throw new Exception("Company not found");
        }

        companyDb.updated_at = DateTime.Now;
        companyDb.modified_by = userId;
        companyDb.is_active = false;
        await _companyDao.Update(companyDb);
    }
}
