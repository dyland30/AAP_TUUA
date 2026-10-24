using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class BoardingGateBL
{
    private readonly BoardingGateDao _boardingGateDao;
    private readonly AirportResourceDao _airportResourceDao;
    private readonly StandDao _standDao;
    private readonly FeatureDao _featureDao;
    private readonly BoardingGateValidator _boardingGateValidator;

    public BoardingGateBL(string cnx)
    {
        _boardingGateDao = new BoardingGateDao(cnx);
        _airportResourceDao = new AirportResourceDao(cnx);
        _standDao = new StandDao(cnx);
        _featureDao = new FeatureDao(cnx);
        _boardingGateValidator = new BoardingGateValidator();
    }

    public async Task<IEnumerable<BoardingGate>?> GetAll()
    {
        return await _boardingGateDao.GetAll();
    }

    public async Task<IEnumerable<BoardingGate>?> GetByTerminalId(Guid terminalId)
    {
        return await _boardingGateDao.GetByTerminalId(terminalId);
    }

    public async Task<BoardingGate?> GetById(Guid resourceId)
    {
        return await _boardingGateDao.GetById(resourceId);
    }

    public async Task<BoardingGate> Add(BoardingGate boardingGate, string? userId)
    {
        var result = await _boardingGateValidator.ValidateAsync(boardingGate);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        await ValidateReferences(boardingGate);

        if (await _boardingGateDao.GetById(boardingGate.resource_id!.Value) is not null)
        {
            throw new Exception("Boarding gate already exists for this resource");
        }

        boardingGate.created_at = DateTime.Now;
        boardingGate.updated_at = DateTime.Now;
        boardingGate.created_by = userId;
        boardingGate.modified_by = userId;
        boardingGate.is_active = true;

        return await _boardingGateDao.Add(boardingGate);
    }

    public async Task<BoardingGate> Update(BoardingGate boardingGate, string? userId)
    {
        var result = await _boardingGateValidator.ValidateAsync(boardingGate);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        if (boardingGate.resource_id == null || boardingGate.resource_id == Guid.Empty)
        {
            throw new Exception("Boarding gate resource id is required");
        }

        var boardingGateDb = await _boardingGateDao.GetById(boardingGate.resource_id.Value);
        if (boardingGateDb is null)
        {
            throw new Exception("Boarding gate not found");
        }

        await ValidateReferences(boardingGate);

        boardingGate.created_at = boardingGateDb.created_at;
        boardingGate.created_by = boardingGateDb.created_by;
        boardingGate.updated_at = DateTime.Now;
        boardingGate.modified_by = userId;
        await _boardingGateDao.Update(boardingGate);

        return boardingGate;
    }

    public async Task Delete(Guid resourceId, string? userId)
    {
        var boardingGateDb = await _boardingGateDao.GetById(resourceId);
        if (boardingGateDb is null)
        {
            throw new Exception("Boarding gate not found");
        }

        boardingGateDb.updated_at = DateTime.Now;
        boardingGateDb.modified_by = userId;
        boardingGateDb.is_active = false;
        await _boardingGateDao.Update(boardingGateDb);
    }

    private async Task ValidateReferences(BoardingGate boardingGate)
    {
        if (await _airportResourceDao.GetById(boardingGate.resource_id!.Value) is null)
        {
            throw new Exception("Airport resource not found");
        }

        if (await _featureDao.GetFeatureById(boardingGate.boarding_type_id) is null)
        {
            throw new Exception("Boarding type not found");
        }

        if (boardingGate.default_stand_id.HasValue &&
            await _standDao.GetById(boardingGate.default_stand_id.Value) is null)
        {
            throw new Exception("Default stand not found");
        }
    }
}
