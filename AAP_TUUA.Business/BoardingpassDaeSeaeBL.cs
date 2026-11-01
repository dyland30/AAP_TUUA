using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class BoardingpassDaeSeaeBL
{
    private readonly BoardingpassDaeSeaeDao _boardingpassDao;
    private readonly TuuaGateDao _tuuaGateDao;
    private readonly AirlineDao _airlineDao;
    private readonly FeatureDao _featureDao;
    private readonly BoardingpassDaeSeaeValidator _boardingpassValidator;

    public BoardingpassDaeSeaeBL(string cnx)
    {
        _boardingpassDao = new BoardingpassDaeSeaeDao(cnx);
        _tuuaGateDao = new TuuaGateDao(cnx);
        _airlineDao = new AirlineDao(cnx);
        _featureDao = new FeatureDao(cnx);
        _boardingpassValidator = new BoardingpassDaeSeaeValidator();
    }

    public async Task<IEnumerable<BoardingpassDaeSeae>?> GetAll()
    {
        return await _boardingpassDao.GetAll();
    }

    public async Task<BoardingpassDaeSeae?> GetById(long id)
    {
        return await _boardingpassDao.GetById(id);
    }

    public async Task<IEnumerable<BoardingpassDaeSeae>?> GetByFlight(string flightNumber, DateTime flightDate)
    {
        return await _boardingpassDao.GetByFlight(flightNumber, flightDate);
    }

    // Serie, correlativo, precio, moneda, estados y aeropuertos de origen/destino los asigna
    // el stored procedure usp_insert_boardingpass_dae_seae.
    public async Task Add(BoardingpassDaeSeae boardingpass, string? userId)
    {
        boardingpass.tuua_gate_code = (boardingpass.tuua_gate_code ?? string.Empty).Trim();
        boardingpass.flight_number = (boardingpass.flight_number ?? string.Empty).Trim();
        boardingpass.passenger_name = (boardingpass.passenger_name ?? string.Empty).Trim();
        boardingpass.passenger_status = (boardingpass.passenger_status ?? string.Empty).Trim();

        var result = await _boardingpassValidator.ValidateAsync(boardingpass);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        var tuuaGate = await _tuuaGateDao.GetByCode(boardingpass.tuua_gate_code);
        if (tuuaGate is null)
        {
            throw new Exception("Tuua gate not found");
        }

        if (string.IsNullOrWhiteSpace(tuuaGate.cashier_code))
        {
            throw new Exception("Tuua gate has no cashier machine assigned");
        }

        if (await _featureDao.GetFeatureById(boardingpass.flight_type_id) is null)
        {
            throw new Exception("Flight type not found");
        }

        if (await _airlineDao.GetById(boardingpass.airline_id) is null)
        {
            throw new Exception("Airline not found");
        }

        boardingpass.created_by = userId;
        boardingpass.modified_by = userId;

        await _boardingpassDao.Add(boardingpass);
    }
}
