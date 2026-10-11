using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class UbigeoBL
{
    private readonly UbigeoDepartamentoDao _departamentoDao;
    private readonly UbigeoProvinciaDao _provinciaDao;
    private readonly UbigeoDistritoDao _distritoDao;
    private readonly UbigeoDepartamentoValidator _departamentoValidator;
    private readonly UbigeoProvinciaValidator _provinciaValidator;
    private readonly UbigeoDistritoValidator _distritoValidator;

    public UbigeoBL(string cnx)
    {
        _departamentoDao = new UbigeoDepartamentoDao(cnx);
        _provinciaDao = new UbigeoProvinciaDao(cnx);
        _distritoDao = new UbigeoDistritoDao(cnx);
        _departamentoValidator = new UbigeoDepartamentoValidator();
        _provinciaValidator = new UbigeoProvinciaValidator();
        _distritoValidator = new UbigeoDistritoValidator();
    }

    public async Task<IEnumerable<UbigeoDepartamento>?> GetAllDepartamentos()
    {
        return await _departamentoDao.GetAll();
    }

    public async Task<UbigeoDepartamento?> GetDepartamentoByCodigo(string codigo)
    {
        return await _departamentoDao.GetByCodigo(codigo);
    }

    public async Task<UbigeoDepartamento> AddDepartamento(UbigeoDepartamento departamento)
    {
        var result = await _departamentoValidator.ValidateAsync(departamento);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        return await _departamentoDao.Add(departamento);
    }

    public async Task<UbigeoDepartamento> UpdateDepartamento(UbigeoDepartamento departamento)
    {
        var result = await _departamentoValidator.ValidateAsync(departamento);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        if (await _departamentoDao.GetByCodigo(departamento.codigo!) is null)
        {
            throw new Exception("Departamento not found");
        }

        await _departamentoDao.Update(departamento);
        return departamento;
    }

    public async Task DeleteDepartamento(string codigo)
    {
        if (await _departamentoDao.GetByCodigo(codigo) is null)
        {
            throw new Exception("Departamento not found");
        }

        if ((await _provinciaDao.GetByDepartamento(codigo)).Any())
        {
            throw new Exception("Departamento has associated provincias");
        }

        await _departamentoDao.Delete(codigo);
    }

    public async Task<IEnumerable<UbigeoProvincia>?> GetAllProvincias()
    {
        return await _provinciaDao.GetAll();
    }

    public async Task<UbigeoProvincia?> GetProvinciaByCodigo(string codigo)
    {
        return await _provinciaDao.GetByCodigo(codigo);
    }

    public async Task<IEnumerable<UbigeoProvincia>?> GetProvinciasByDepartamento(string codigoDepartamento)
    {
        return await _provinciaDao.GetByDepartamento(codigoDepartamento);
    }

    public async Task<UbigeoProvincia> AddProvincia(UbigeoProvincia provincia)
    {
        var result = await _provinciaValidator.ValidateAsync(provincia);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        if (await _departamentoDao.GetByCodigo(provincia.codigo_departamento!) is null)
        {
            throw new Exception("Departamento not found");
        }

        return await _provinciaDao.Add(provincia);
    }

    public async Task<UbigeoProvincia> UpdateProvincia(UbigeoProvincia provincia)
    {
        var result = await _provinciaValidator.ValidateAsync(provincia);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        if (await _provinciaDao.GetByCodigo(provincia.codigo!) is null)
        {
            throw new Exception("Provincia not found");
        }

        if (await _departamentoDao.GetByCodigo(provincia.codigo_departamento!) is null)
        {
            throw new Exception("Departamento not found");
        }

        await _provinciaDao.Update(provincia);
        return provincia;
    }

    public async Task DeleteProvincia(string codigo)
    {
        if (await _provinciaDao.GetByCodigo(codigo) is null)
        {
            throw new Exception("Provincia not found");
        }

        if ((await _distritoDao.GetByProvincia(codigo)).Any())
        {
            throw new Exception("Provincia has associated distritos");
        }

        await _provinciaDao.Delete(codigo);
    }

    public async Task<IEnumerable<UbigeoDistrito>?> GetAllDistritos()
    {
        return await _distritoDao.GetAll();
    }

    public async Task<UbigeoDistrito?> GetDistritoByCodigo(string codigo)
    {
        return await _distritoDao.GetByCodigo(codigo);
    }

    public async Task<IEnumerable<UbigeoDistrito>?> GetDistritosByProvincia(string codigoProvincia)
    {
        return await _distritoDao.GetByProvincia(codigoProvincia);
    }

    public async Task<UbigeoDistrito> AddDistrito(UbigeoDistrito distrito)
    {
        var result = await _distritoValidator.ValidateAsync(distrito);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        if (await _provinciaDao.GetByCodigo(distrito.codigo_provincia!) is null)
        {
            throw new Exception("Provincia not found");
        }

        return await _distritoDao.Add(distrito);
    }

    public async Task<UbigeoDistrito> UpdateDistrito(UbigeoDistrito distrito)
    {
        var result = await _distritoValidator.ValidateAsync(distrito);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        if (await _distritoDao.GetByCodigo(distrito.codigo!) is null)
        {
            throw new Exception("Distrito not found");
        }

        if (await _provinciaDao.GetByCodigo(distrito.codigo_provincia!) is null)
        {
            throw new Exception("Provincia not found");
        }

        await _distritoDao.Update(distrito);
        return distrito;
    }

    public async Task DeleteDistrito(string codigo)
    {
        if (await _distritoDao.GetByCodigo(codigo) is null)
        {
            throw new Exception("Distrito not found");
        }

        await _distritoDao.Delete(codigo);
    }
}
