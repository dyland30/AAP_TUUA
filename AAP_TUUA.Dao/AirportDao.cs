using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class AirportDao
{
    private readonly string _cnx;

    public AirportDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<Airport>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<Airport>("select * from public.airport order by name");
        return result.ToList();
    }

    public async Task<Airport?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<Airport>("select * from public.airport where id = @id", new { id });
    }

    public async Task<Airport> Add(Airport airport)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.airport (iata_code, oaci_code, name, city, region, country_code,
                             ubigeo, latitude, longitude, elevation_m, elevation_f, timezone, airport_type,
                             is_active, created_at, updated_at, created_by, modified_by)
                         values (@iata_code, @oaci_code, @name, @city, @region, @country_code,
                             @ubigeo, @latitude, @longitude, @elevation_m, @elevation_f, @timezone, @airport_type,
                             @is_active, @created_at, @updated_at, @created_by, @modified_by)
                         returning id;";
        airport.id = await cnn.QueryFirstOrDefaultAsync<Guid>(query, airport);
        return airport;
    }

    public async Task Update(Airport airport)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.airport
                         set iata_code = @iata_code,
                             oaci_code = @oaci_code,
                             name = @name,
                             city = @city,
                             region = @region,
                             country_code = @country_code,
                             ubigeo = @ubigeo,
                             latitude = @latitude,
                             longitude = @longitude,
                             elevation_m = @elevation_m,
                             elevation_f = @elevation_f,
                             timezone = @timezone,
                             airport_type = @airport_type,
                             is_active = @is_active,
                             updated_at = @updated_at,
                             modified_by = @modified_by
                         where id = @id;";
        await cnn.ExecuteAsync(query, airport);
    }
}
