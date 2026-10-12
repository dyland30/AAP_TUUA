using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class TuuaGateDao
{
    private readonly string _cnx;

    public TuuaGateDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<TuuaGate>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<TuuaGate>("select * from public.tuua_gate order by code");
        return result.ToList();
    }

    public async Task<TuuaGate?> GetByCode(string code)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<TuuaGate>(
            "select * from public.tuua_gate where code = @code", new { code });
    }

    public async Task<List<TuuaGate>> GetByTerminalId(Guid terminalId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<TuuaGate>(
            "select * from public.tuua_gate where terminal_id = @terminalId order by code", new { terminalId });
        return result.ToList();
    }

    public async Task<List<string>> GetCodesByPrefix(string prefix)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<string>(
            "select code from public.tuua_gate where code like @pattern", new { pattern = prefix + "%" });
        return result.ToList();
    }

    public async Task<TuuaGate> Add(TuuaGate tuuaGate)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.tuua_gate (code, ipaddr, description, terminal_id, flight_type_id,
                             tuua_gate_type_id, is_active, created_at, updated_at, created_by, modified_by)
                         values (@code, @ipaddr, @description, @terminal_id, @flight_type_id,
                             @tuua_gate_type_id, @is_active, @created_at, @updated_at, @created_by, @modified_by)
                         returning code;";
        tuuaGate.code = await cnn.QueryFirstOrDefaultAsync<string>(query, tuuaGate);
        return tuuaGate;
    }

    public async Task Update(TuuaGate tuuaGate)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.tuua_gate
                         set ipaddr = @ipaddr,
                             description = @description,
                             terminal_id = @terminal_id,
                             flight_type_id = @flight_type_id,
                             tuua_gate_type_id = @tuua_gate_type_id,
                             is_active = @is_active,
                             updated_at = @updated_at,
                             modified_by = @modified_by
                         where code = @code;";
        await cnn.ExecuteAsync(query, tuuaGate);
    }
}
