using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class TerminalDao
{
    private readonly string _cnx;

    public TerminalDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<Terminal>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<Terminal>("select * from public.terminal order by name");
        return result.ToList();
    }

    public async Task<Terminal?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<Terminal>("select * from public.terminal where id = @id", new { id });
    }

    public async Task<List<Terminal>> GetByAirportId(Guid airportId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<Terminal>(
            "select * from public.terminal where airport_id = @airportId order by name", new { airportId });
        return result.ToList();
    }

    public async Task<Terminal> Add(Terminal terminal)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.terminal (airport_id, location_id, name, is_active,
                             created_at, updated_at, created_by, modified_by)
                         values (@airport_id, @location_id, @name, @is_active,
                             @created_at, @updated_at, @created_by, @modified_by)
                         returning id;";
        terminal.id = await cnn.QueryFirstOrDefaultAsync<Guid>(query, terminal);
        return terminal;
    }

    public async Task Update(Terminal terminal)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.terminal
                         set airport_id = @airport_id,
                             location_id = @location_id,
                             name = @name,
                             is_active = @is_active,
                             updated_at = @updated_at,
                             modified_by = @modified_by
                         where id = @id;";
        await cnn.ExecuteAsync(query, terminal);
    }
}
