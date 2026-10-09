using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class AirlineBL
{
    private readonly AirlineDao _airlineDao;
    private readonly AirlineValidator _airlineValidator;

    public AirlineBL(string cnx)
    {
        _airlineDao = new AirlineDao(cnx);
        _airlineValidator = new AirlineValidator();
    }

    public async Task<IEnumerable<Airline>?> GetAll()
    {
        return await _airlineDao.GetAll();
    }

    public async Task<Airline?> GetById(Guid id)
    {
        return await _airlineDao.GetById(id);
    }

    public async Task<Airline> Add(Airline airline, string? userId)
    {
        var result = await _airlineValidator.ValidateAsync(airline);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        airline.created_at = DateTime.Now;
        airline.updated_at = DateTime.Now;
        airline.created_by = userId;
        airline.modified_by = userId;
        airline.is_active = true;

        var resp = await _airlineDao.Add(airline);

        return resp;
    }

    public async Task<Airline> Update(Airline airline, string? userId)
    {
        var result = await _airlineValidator.ValidateAsync(airline);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        airline.updated_at = DateTime.Now;
        airline.modified_by = userId;
        await _airlineDao.Update(airline);

        return airline;
    }

    public async Task Delete(Guid id, string? userId)
    {
        var airlineDb = await _airlineDao.GetById(id);
        if (airlineDb is null)
        {
            throw new Exception("airline not found");
        }

        airlineDb.updated_at = DateTime.Now;
        airlineDb.modified_by = userId;
        airlineDb.is_active = false;
        await _airlineDao.Update(airlineDb);
    }
}
