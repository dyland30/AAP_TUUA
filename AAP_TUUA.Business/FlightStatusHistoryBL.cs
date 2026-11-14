using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class FlightStatusHistoryBL
{
    private readonly FlightStatusHistoryDao _dao;
    public FlightStatusHistoryBL(string cnx)
    {
        _dao = new FlightStatusHistoryDao(cnx);
    }
    public Task<List<FlightStatusHistory>> GetAll() => _dao.GetAll();
    public Task<FlightStatusHistory?> GetById(Guid id) => _dao.GetById(id);
    public Task<List<FlightStatusHistory>> GetByFlightId(Guid flightId) => _dao.GetByFlightId(flightId);
}
