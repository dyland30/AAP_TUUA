using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class AircraftDao
{
    private readonly string _cnx;

    public AircraftDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<Aircraft>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<Aircraft>(
            "select * from public.aircraft order by registration");
        return result.ToList();
    }

    public async Task<List<Aircraft>> GetByOperatorId(Guid operatorId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<Aircraft>(
            "select * from public.aircraft where operator_id = @operatorId order by registration",
            new { operatorId });
        return result.ToList();
    }

    public async Task<List<Aircraft>> GetByAircraftTypeId(Guid aircraftTypeId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<Aircraft>(
            "select * from public.aircraft where aircraft_type_id = @aircraftTypeId order by registration",
            new { aircraftTypeId });
        return result.ToList();
    }

    public async Task<Aircraft?> GetByRegistration(string registration)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<Aircraft>(
            "select * from public.aircraft where registration = @registration", new { registration });
    }

    public async Task<Aircraft?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<Aircraft>(
            "select * from public.aircraft where id = @id", new { id });
    }

    public async Task<Aircraft> Add(Aircraft aircraft)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.aircraft (registration, aircraft_type_id, operator_id,
                             seat_count, is_active, created_at, updated_at, created_by, modified_by)
                         values (@registration, @aircraft_type_id, @operator_id,
                             @seat_count, @is_active, @created_at, @updated_at, @created_by, @modified_by)
                         returning id;";
        aircraft.id = await cnn.QueryFirstOrDefaultAsync<Guid>(query, aircraft);
        return aircraft;
    }

    public async Task Update(Aircraft aircraft)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.aircraft
                         set registration = @registration,
                             aircraft_type_id = @aircraft_type_id,
                             operator_id = @operator_id,
                             seat_count = @seat_count,
                             is_active = @is_active,
                             updated_at = @updated_at,
                             modified_by = @modified_by
                         where id = @id;";
        await cnn.ExecuteAsync(query, aircraft);
    }

    public async Task Delete(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync("delete from public.aircraft where id = @id", new { id });
    }
}
