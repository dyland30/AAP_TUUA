using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class AircraftTypeBL
{
    private readonly AircraftTypeDao _aircraftTypeDao;
    private readonly FeatureDao _featureDao;
    private readonly AircraftTypeValidator _aircraftTypeValidator;

    public AircraftTypeBL(string cnx)
    {
        _aircraftTypeDao = new AircraftTypeDao(cnx);
        _featureDao = new FeatureDao(cnx);
        _aircraftTypeValidator = new AircraftTypeValidator();
    }

    public async Task<IEnumerable<AircraftType>?> GetAll()
    {
        return await _aircraftTypeDao.GetAll();
    }

    public async Task<IEnumerable<AircraftType>?> GetByManufacturerId(int manufacturerId)
    {
        return await _aircraftTypeDao.GetByManufacturerId(manufacturerId);
    }

    public async Task<IEnumerable<AircraftType>?> GetBySizeCodeId(int sizeCodeId)
    {
        return await _aircraftTypeDao.GetBySizeCodeId(sizeCodeId);
    }

    public async Task<AircraftType?> GetById(Guid id)
    {
        return await _aircraftTypeDao.GetById(id);
    }

    public async Task<AircraftType> Add(AircraftType aircraftType, string? userId)
    {
        var result = await _aircraftTypeValidator.ValidateAsync(aircraftType);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        await ValidateReferences(aircraftType);

        var now = DateTime.Now;
        aircraftType.created_at = now;
        aircraftType.updated_at = now;
        aircraftType.created_by = userId;
        aircraftType.modified_by = userId;
        aircraftType.is_active = true;

        return await _aircraftTypeDao.Add(aircraftType);
    }

    public async Task<AircraftType> Update(AircraftType aircraftType, string? userId)
    {
        var result = await _aircraftTypeValidator.ValidateAsync(aircraftType);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        if (aircraftType.id is null || aircraftType.id == Guid.Empty)
        {
            throw new Exception("Aircraft type id is required");
        }

        var aircraftTypeDb = await _aircraftTypeDao.GetById(aircraftType.id.Value);
        if (aircraftTypeDb is null)
        {
            throw new Exception("Aircraft type not found");
        }

        await ValidateReferences(aircraftType);

        aircraftType.created_at = aircraftTypeDb.created_at;
        aircraftType.created_by = aircraftTypeDb.created_by;
        aircraftType.updated_at = DateTime.Now;
        aircraftType.modified_by = userId;

        await _aircraftTypeDao.Update(aircraftType);

        return aircraftType;
    }

    public async Task Delete(Guid id, string? userId)
    {
        var aircraftTypeDb = await _aircraftTypeDao.GetById(id);
        if (aircraftTypeDb is null)
        {
            throw new Exception("Aircraft type not found");
        }

        aircraftTypeDb.updated_at = DateTime.Now;
        aircraftTypeDb.modified_by = userId;
        aircraftTypeDb.is_active = false;
        await _aircraftTypeDao.Update(aircraftTypeDb);
    }

    private async Task ValidateReferences(AircraftType aircraftType)
    {
        if (await _featureDao.GetFeatureById(aircraftType.manufacturer_id) is null)
        {
            throw new Exception("Manufacturer not found");
        }

        if (await _featureDao.GetFeatureById(aircraftType.size_code_id) is null)
        {
            throw new Exception("Aircraft size code not found");
        }
    }
}
