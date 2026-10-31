using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class AircraftTypeDao
{
    private readonly string _cnx;

    public AircraftTypeDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<AircraftType>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<AircraftType>(
            "select * from public.aircraft_type order by icao_code");
        return result.ToList();
    }

    public async Task<List<AircraftType>> GetByManufacturerId(int manufacturerId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<AircraftType>(
            "select * from public.aircraft_type where manufacturer_id = @manufacturerId order by icao_code",
            new { manufacturerId });
        return result.ToList();
    }

    public async Task<List<AircraftType>> GetBySizeCodeId(int sizeCodeId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<AircraftType>(
            "select * from public.aircraft_type where size_code_id = @sizeCodeId order by icao_code",
            new { sizeCodeId });
        return result.ToList();
    }

    public async Task<AircraftType?> GetByIcaoCode(string icaoCode)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<AircraftType>(
            "select * from public.aircraft_type where icao_code = @icaoCode", new { icaoCode });
    }

    public async Task<AircraftType?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<AircraftType>(
            "select * from public.aircraft_type where id = @id", new { id });
    }

    public async Task<AircraftType> Add(AircraftType aircraftType)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.aircraft_type (icao_code, iata_code, manufacturer_id, model,
                             size_code_id, wingspan_m, length_m, max_seats, is_widebody, is_active,
                             created_at, updated_at, created_by, modified_by)
                         values (@icao_code, @iata_code, @manufacturer_id, @model,
                             @size_code_id, @wingspan_m, @length_m, @max_seats, @is_widebody, @is_active,
                             @created_at, @updated_at, @created_by, @modified_by)
                         returning id;";
        aircraftType.id = await cnn.QueryFirstOrDefaultAsync<Guid>(query, aircraftType);
        return aircraftType;
    }

    public async Task Update(AircraftType aircraftType)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.aircraft_type
                         set icao_code = @icao_code,
                             iata_code = @iata_code,
                             manufacturer_id = @manufacturer_id,
                             model = @model,
                             size_code_id = @size_code_id,
                             wingspan_m = @wingspan_m,
                             length_m = @length_m,
                             max_seats = @max_seats,
                             is_widebody = @is_widebody,
                             is_active = @is_active,
                             updated_at = @updated_at,
                             modified_by = @modified_by
                         where id = @id;";
        await cnn.ExecuteAsync(query, aircraftType);
    }

    public async Task Delete(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync("delete from public.aircraft_type where id = @id", new { id });
    }
}
