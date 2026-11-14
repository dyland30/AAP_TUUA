using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class AirportSectorDao
{
    private readonly string _cnx;
    public AirportSectorDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<AirportSector>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<AirportSector>("select * from public.airport_sector order by code")).ToList();
    }

    public async Task<AirportSector?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<AirportSector>("select * from public.airport_sector where id = @id", new
        {
            id
        });
    }

    public async Task<List<AirportSector>> GetByAirportId(Guid airportId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<AirportSector>("select * from public.airport_sector where airport_id = @airportId order by code", new
        {
            airportId
        })).ToList();
    }

    public async Task<AirportSector> Add(AirportSector entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.airport_sector (airport_id, terminal_id, parent_id, code, name, level,
            description, is_active, created_at, updated_at, created_by, modified_by)
            values (@airport_id, @terminal_id, @parent_id, @code, @name, @level, @description,
            @is_active, @created_at, @updated_at, @created_by, @modified_by) returning id;";
        entity.id = await cnn.QuerySingleAsync<Guid>(query, entity);
        return entity;
    }

    public async Task Update(AirportSector entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.airport_sector set airport_id = @airport_id, terminal_id = @terminal_id,
            parent_id = @parent_id, code = @code, name = @name, level = @level, description = @description,
            is_active = @is_active, updated_at = @updated_at, modified_by = @modified_by where id = @id;";
        await cnn.ExecuteAsync(query, entity);
    }
}
