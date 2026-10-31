using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class TurnaroundDao
{
    private readonly string _cnx;

    public TurnaroundDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<Turnaround>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<Turnaround>(
            "select * from public.turnaround order by created_at desc");
        return result.ToList();
    }

    public async Task<List<Turnaround>> GetByArrivalFlightId(Guid arrivalFlightId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<Turnaround>(
            "select * from public.turnaround where arrival_flight_id = @arrivalFlightId order by created_at desc",
            new { arrivalFlightId });
        return result.ToList();
    }

    public async Task<List<Turnaround>> GetByDepartureFlightId(Guid departureFlightId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<Turnaround>(
            "select * from public.turnaround where departure_flight_id = @departureFlightId order by created_at desc",
            new { departureFlightId });
        return result.ToList();
    }

    public async Task<Turnaround?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<Turnaround>(
            "select * from public.turnaround where id = @id", new { id });
    }

    public async Task<Turnaround> Add(Turnaround turnaround)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.turnaround (arrival_flight_id, departure_flight_id, min_ground_time,
                             created_at, updated_at, created_by, modified_by)
                         values (@arrival_flight_id, @departure_flight_id, @min_ground_time,
                             @created_at, @updated_at, @created_by, @modified_by)
                         returning id;";
        turnaround.id = await cnn.QueryFirstOrDefaultAsync<Guid>(query, turnaround);
        return turnaround;
    }

    public async Task Update(Turnaround turnaround)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.turnaround
                         set arrival_flight_id = @arrival_flight_id,
                             departure_flight_id = @departure_flight_id,
                             min_ground_time = @min_ground_time,
                             updated_at = @updated_at,
                             modified_by = @modified_by
                         where id = @id;";
        await cnn.ExecuteAsync(query, turnaround);
    }

    public async Task Delete(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync("delete from public.turnaround where id = @id", new { id });
    }
}
