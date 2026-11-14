using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class EvacuationRouteDao
{
    private readonly string _cnx;
    public EvacuationRouteDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<EvacuationRoute>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<EvacuationRoute>("select * from public.evacuation_route order by code")).ToList();
    }

    public async Task<EvacuationRoute?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<EvacuationRoute>("select * from public.evacuation_route where id = @id", new
        {
            id
        });
    }

    public async Task<List<EvacuationRoute>> GetByAirportSectorId(Guid airportSectorId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<EvacuationRoute>("select * from public.evacuation_route where airport_sector_id = @airportSectorId order by code", new
        {
            airportSectorId
        })).ToList();
    }

    public async Task<EvacuationRoute> Add(EvacuationRoute entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.evacuation_route (airport_sector_id, code, name_es, name_en, direction_icon,
            exit_name, is_default, is_active, created_at, updated_at, created_by, modified_by)
            values (@airport_sector_id, @code, @name_es, @name_en, @direction_icon, @exit_name,
            @is_default, @is_active, @created_at, @updated_at, @created_by, @modified_by) returning id;";
        entity.id = await cnn.QuerySingleAsync<Guid>(query, entity);
        return entity;
    }

    public async Task Update(EvacuationRoute entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.evacuation_route set airport_sector_id = @airport_sector_id, code = @code,
            name_es = @name_es, name_en = @name_en, direction_icon = @direction_icon, exit_name = @exit_name,
            is_default = @is_default, is_active = @is_active, updated_at = @updated_at, modified_by = @modified_by where id = @id;";
        await cnn.ExecuteAsync(query, entity);
    }
}
