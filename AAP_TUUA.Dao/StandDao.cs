using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class StandDao
{
    private readonly string _cnx;

    public StandDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<Stand>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<Stand>("select * from public.stand");
        return result.ToList();
    }

    public async Task<List<Stand>> GetByTerminalId(Guid terminalId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<Stand>(
            @"select s.* from public.stand s
              inner join public.airport_resource r on r.id = s.resource_id
              where r.terminal_id = @terminalId
              order by r.code", new { terminalId });
        return result.ToList();
    }

    public async Task<Stand?> GetById(Guid resourceId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<Stand>(
            "select * from public.stand where resource_id = @resourceId", new { resourceId });
    }

    public async Task<Stand> Add(Stand stand)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.stand (resource_id, is_contact, max_aircraft_size_type,
                             max_wingspan_m, has_fixed_gpu, has_pca, has_fuel_hydrant)
                         values (@resource_id, @is_contact, @max_aircraft_size_type,
                             @max_wingspan_m, @has_fixed_gpu, @has_pca, @has_fuel_hydrant);";
        await cnn.ExecuteAsync(query, stand);
        return stand;
    }

    public async Task Update(Stand stand)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.stand
                         set is_contact = @is_contact,
                             max_aircraft_size_type = @max_aircraft_size_type,
                             max_wingspan_m = @max_wingspan_m,
                             has_fixed_gpu = @has_fixed_gpu,
                             has_pca = @has_pca,
                             has_fuel_hydrant = @has_fuel_hydrant
                         where resource_id = @resource_id;";
        await cnn.ExecuteAsync(query, stand);
    }

    public async Task Delete(Guid resourceId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync("delete from public.stand where resource_id = @resourceId", new { resourceId });
    }
}
