using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class FlightCodeshareDao
{
    private readonly string _cnx;

    public FlightCodeshareDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<FlightCodeshare>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<FlightCodeshare>(
            "select * from public.flight_codeshare order by flight_identity");
        return result.ToList();
    }

    public async Task<List<FlightCodeshare>> GetByFlightId(Guid flightId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<FlightCodeshare>(
            "select * from public.flight_codeshare where flight_id = @flightId order by flight_identity",
            new { flightId });
        return result.ToList();
    }

    public async Task<List<FlightCodeshare>> GetByAirlineId(Guid airlineId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<FlightCodeshare>(
            "select * from public.flight_codeshare where airline_id = @airlineId order by flight_identity",
            new { airlineId });
        return result.ToList();
    }

    public async Task<FlightCodeshare?> GetById(Guid flightId, Guid airlineId, string flightIdentity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<FlightCodeshare>(
            @"select * from public.flight_codeshare
              where flight_id = @flightId and airline_id = @airlineId and flight_identity = @flightIdentity",
            new { flightId, airlineId, flightIdentity });
    }

    public async Task Add(FlightCodeshare codeshare)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.flight_codeshare (flight_id, airline_id, flight_identity)
                         values (@flight_id, @airline_id, @flight_identity);";
        await cnn.ExecuteAsync(query, codeshare);
    }

    public async Task Delete(Guid flightId, Guid airlineId, string flightIdentity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync(
            @"delete from public.flight_codeshare
              where flight_id = @flightId and airline_id = @airlineId and flight_identity = @flightIdentity",
            new { flightId, airlineId, flightIdentity });
    }
}
