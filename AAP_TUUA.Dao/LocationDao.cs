using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class LocationDao
{
    private readonly string _cnx;

    public LocationDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<Location>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<Location>("select * from public.location order by name");
        return result.ToList();
    }

    public async Task<Location?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<Location>("select * from public.location where id = @id", new { id });
    }

    public async Task<List<Location>> GetByAirportId(Guid airportId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<Location>(
            "select * from public.location where airport_id = @airportId order by name", new { airportId });
        return result.ToList();
    }

    public async Task<Location> Add(Location location)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.location (airport_id, name, description, ubigeo)
                         values (@airport_id, @name, @description, @ubigeo)
                         returning id;";
        location.id = await cnn.QueryFirstOrDefaultAsync<Guid>(query, location);
        return location;
    }

    public async Task Update(Location location)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.location
                         set airport_id = @airport_id,
                             name = @name,
                             description = @description,
                             ubigeo = @ubigeo
                         where id = @id;";
        await cnn.ExecuteAsync(query, location);
    }

    public async Task Delete(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync("delete from public.location where id = @id", new { id });
    }
}
