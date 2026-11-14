using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class FlightStatusHistoryDao
{
    private readonly string _cnx;
    public FlightStatusHistoryDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<FlightStatusHistory>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<FlightStatusHistory>("select * from public.flight_status_history order by changed_at desc, id desc")).ToList();
    }

    public async Task<FlightStatusHistory?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<FlightStatusHistory>("select * from public.flight_status_history where id = @id", new
        {
            id
        });
    }

    public async Task<List<FlightStatusHistory>> GetByFlightId(Guid flightId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<FlightStatusHistory>("select * from public.flight_status_history where flight_id = @flightId order by changed_at desc, id desc", new
        {
            flightId
        })).ToList();
    }
}
