using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class AirportResourceDao
{
    private readonly string _cnx;

    public AirportResourceDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<AirportResource>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<AirportResource>(
            "select * from public.airport_resource order by code");
        return result.ToList();
    }

    public async Task<List<AirportResource>> GetByTerminalId(Guid terminalId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<AirportResource>(
            "select * from public.airport_resource where terminal_id = @terminalId order by code", new { terminalId });
        return result.ToList();
    }

    public async Task<List<AirportResource>> GetByResourceTypeId(int resourceTypeId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<AirportResource>(
            "select * from public.airport_resource where resource_type_id = @resourceTypeId order by code",
            new { resourceTypeId });
        return result.ToList();
    }

    public async Task<AirportResource?> GetByCode(string code)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<AirportResource>(
            "select * from public.airport_resource where code = @code", new { code });
    }

    public async Task<AirportResource?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<AirportResource>(
            "select * from public.airport_resource where id = @id", new { id });
    }

    public async Task<AirportResource> Add(AirportResource resource)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.airport_resource (resource_type_id, terminal_id, flight_type_id,
                             status_id, code, name, is_active, created_at, updated_at, created_by, modified_by)
                         values (@resource_type_id, @terminal_id, @flight_type_id,
                             @status_id, @code, @name, @is_active, @created_at, @updated_at, @created_by, @modified_by)
                         returning id;";
        resource.id = await cnn.QueryFirstOrDefaultAsync<Guid>(query, resource);
        return resource;
    }

    public async Task Update(AirportResource resource)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.airport_resource
                         set resource_type_id = @resource_type_id,
                             terminal_id = @terminal_id,
                             flight_type_id = @flight_type_id,
                             status_id = @status_id,
                             code = @code,
                             name = @name,
                             is_active = @is_active,
                             updated_at = @updated_at,
                             modified_by = @modified_by
                         where id = @id;";
        await cnn.ExecuteAsync(query, resource);
    }

    public async Task Delete(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync("delete from public.airport_resource where id = @id", new { id });
    }
}
