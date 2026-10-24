using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class PassengerLoadingBridgeBL
{
    private readonly PassengerLoadingBridgeDao _bridgeDao;
    private readonly AirportResourceDao _airportResourceDao;
    private readonly BoardingGateDao _boardingGateDao;
    private readonly StandDao _standDao;
    private readonly FeatureDao _featureDao;
    private readonly PassengerLoadingBridgeValidator _bridgeValidator;

    public PassengerLoadingBridgeBL(string cnx)
    {
        _bridgeDao = new PassengerLoadingBridgeDao(cnx);
        _airportResourceDao = new AirportResourceDao(cnx);
        _boardingGateDao = new BoardingGateDao(cnx);
        _standDao = new StandDao(cnx);
        _featureDao = new FeatureDao(cnx);
        _bridgeValidator = new PassengerLoadingBridgeValidator();
    }

    public async Task<IEnumerable<PassengerLoadingBridge>?> GetAll()
    {
        return await _bridgeDao.GetAll();
    }

    public async Task<IEnumerable<PassengerLoadingBridge>?> GetByBoardingGateId(Guid boardingGateId)
    {
        return await _bridgeDao.GetByBoardingGateId(boardingGateId);
    }

    public async Task<IEnumerable<PassengerLoadingBridge>?> GetByStandId(Guid standId)
    {
        return await _bridgeDao.GetByStandId(standId);
    }

    public async Task<PassengerLoadingBridge?> GetById(Guid resourceId)
    {
        return await _bridgeDao.GetById(resourceId);
    }

    public async Task<PassengerLoadingBridge> Add(PassengerLoadingBridge bridge, string? userId)
    {
        var result = await _bridgeValidator.ValidateAsync(bridge);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        await ValidateReferences(bridge);

        if (await _bridgeDao.GetById(bridge.resource_id!.Value) is not null)
        {
            throw new Exception("Passenger loading bridge already exists for this resource");
        }

        return await _bridgeDao.Add(bridge);
    }

    public async Task<PassengerLoadingBridge> Update(PassengerLoadingBridge bridge, string? userId)
    {
        var result = await _bridgeValidator.ValidateAsync(bridge);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        if (bridge.resource_id == null || bridge.resource_id == Guid.Empty)
        {
            throw new Exception("Passenger loading bridge resource id is required");
        }

        if (await _bridgeDao.GetById(bridge.resource_id.Value) is null)
        {
            throw new Exception("Passenger loading bridge not found");
        }

        await ValidateReferences(bridge);

        await _bridgeDao.Update(bridge);
        return bridge;
    }

    public async Task Delete(Guid resourceId, string? userId)
    {
        if (await _bridgeDao.GetById(resourceId) is null)
        {
            throw new Exception("Passenger loading bridge not found");
        }

        await _bridgeDao.Delete(resourceId);
    }

    private async Task ValidateReferences(PassengerLoadingBridge bridge)
    {
        if (await _airportResourceDao.GetById(bridge.resource_id!.Value) is null)
        {
            throw new Exception("Airport resource not found");
        }

        if (await _boardingGateDao.GetById(bridge.boarding_gate_id) is null)
        {
            throw new Exception("Boarding gate not found");
        }

        if (await _standDao.GetById(bridge.stand_id) is null)
        {
            throw new Exception("Stand not found");
        }

        if (await _featureDao.GetFeatureById(bridge.bridge_type_id) is null)
        {
            throw new Exception("Bridge type not found");
        }

        if (await _featureDao.GetFeatureById(bridge.max_aircraft_size_id) is null)
        {
            throw new Exception("Aircraft size type not found");
        }
    }
}
