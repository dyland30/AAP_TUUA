using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class RunwayDao
{
    private readonly string _cnx;

    public RunwayDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<Runway>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<Runway>(
            "select * from public.runway order by designator");
        return result.ToList();
    }

    public async Task<List<Runway>> GetByAirportId(Guid airportId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<Runway>(
            "select * from public.runway where airport_id = @airportId order by designator", new { airportId });
        return result.ToList();
    }

    public async Task<Runway?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<Runway>(
            "select * from public.runway where id = @id", new { id });
    }

    public async Task<Runway> Add(Runway runway)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.runway (airport_id, designator, length_m, width_m, surface,
                             status_id, is_active, created_at, updated_at, created_by, modified_by)
                         values (@airport_id, @designator, @length_m, @width_m, @surface,
                             @status_id, @is_active, @created_at, @updated_at, @created_by, @modified_by)
                         returning id;";
        runway.id = await cnn.QueryFirstOrDefaultAsync<Guid>(query, runway);
        return runway;
    }

    public async Task Update(Runway runway)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.runway
                         set airport_id = @airport_id,
                             designator = @designator,
                             length_m = @length_m,
                             width_m = @width_m,
                             surface = @surface,
                             status_id = @status_id,
                             is_active = @is_active,
                             updated_at = @updated_at,
                             modified_by = @modified_by
                         where id = @id;";
        await cnn.ExecuteAsync(query, runway);
    }

    public async Task Delete(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync("delete from public.runway where id = @id", new { id });
    }
}
