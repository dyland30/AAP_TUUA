using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class BoardingpassDaeSeaeBL
{
    private const int MaxSearchDays = 92;
    private const int MaxPageSize = 100;
    private const int MaxExportRows = 50000;

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

    public async Task<PagedResult<BoardingpassSearchItem>> Search(BoardingpassSearchFilter filter)
    {
        ValidateSearchFilter(filter);

        filter.page = Math.Max(1, filter.page);
        filter.page_size = Math.Clamp(filter.page_size, 1, MaxPageSize);

        return await _boardingpassDao.Search(filter);
    }

    // Exporta a Excel todos los boardingpass que cumplen los filtros (sin paginar), hasta MaxExportRows.
    public async Task<byte[]> Export(BoardingpassSearchFilter filter)
    {
        ValidateSearchFilter(filter);

        var rows = await _boardingpassDao.Export(filter, MaxExportRows + 1);
        if (rows.Count > MaxExportRows)
        {
            throw new Exception($"The export exceeds {MaxExportRows} rows; narrow the filters");
        }

        return BoardingpassExcelBL.Generate(rows);
    }

    private static void ValidateSearchFilter(BoardingpassSearchFilter filter)
    {
        if (filter.date_from is null || filter.date_to is null)
        {
            throw new Exception("The date range is required");
        }

        if (filter.date_from.Value.Date > filter.date_to.Value.Date)
        {
            throw new Exception("The start date cannot be after the end date");
        }

        if ((filter.date_to.Value.Date - filter.date_from.Value.Date).TotalDays > MaxSearchDays)
        {
            throw new Exception($"The date range cannot exceed {MaxSearchDays} days");
        }

        if (filter.time_from is not null && filter.time_to is not null && filter.time_from > filter.time_to)
        {
            throw new Exception("The start time cannot be after the end time");
        }
    }

    public async Task<BoardingpassDaeSeae?> GetById(long id)
    {
        return await _boardingpassDao.GetById(id);
    }

    public async Task<IEnumerable<BoardingpassDaeSeae>?> GetByFlight(string flightNumber, DateTime flightDate)
    {
        return await _boardingpassDao.GetByFlight(flightNumber, flightDate);
    }

    //get by key
    public async Task<List<BoardingpassDaeSeae>?> GetByKey(DateTime flightDate,string flightNumber,  string seatNumber, string passengerName, int checkinSequenceNumber)
    {
        return await _boardingpassDao.GetByKey(flightDate,flightNumber, seatNumber, passengerName, checkinSequenceNumber);
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
