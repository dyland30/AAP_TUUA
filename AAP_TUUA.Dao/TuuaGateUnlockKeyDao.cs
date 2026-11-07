using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class TuuaGateUnlockKeyDao
{
    private readonly string _cnx;

    public TuuaGateUnlockKeyDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<TuuaGateUnlockKey>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<TuuaGateUnlockKey>(
            "select * from public.tuua_gate_unlock_keys order by created_at desc");
        return result.ToList();
    }

    public async Task<TuuaGateUnlockKey?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<TuuaGateUnlockKey>(
            "select * from public.tuua_gate_unlock_keys where id = @id", new { id });
    }

    public async Task<TuuaGateUnlockKey?> GetActiveByCode(string code)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<TuuaGateUnlockKey>(
            "select * from public.tuua_gate_unlock_keys where code = @code and is_active = true limit 1", new { code });
    }

    public async Task<List<TuuaGateUnlockKey>> GetByUserId(Guid userId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<TuuaGateUnlockKey>(
            "select * from public.tuua_gate_unlock_keys where user_id = @userId order by created_at desc", new { userId });
        return result.ToList();
    }

    public async Task<TuuaGateUnlockKey> Add(TuuaGateUnlockKey key)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.tuua_gate_unlock_keys (user_id, code, type_id, is_active,
                             created_at, updated_at, created_by, modified_by)
                         values (@user_id, @code, @type_id, @is_active,
                             @created_at, @updated_at, @created_by, @modified_by)
                         returning id;";
        key.id = await cnn.QueryFirstOrDefaultAsync<Guid>(query, key);
        return key;
    }

    public async Task Update(TuuaGateUnlockKey key)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.tuua_gate_unlock_keys
                         set is_active = @is_active,
                             updated_at = @updated_at,
                             modified_by = @modified_by
                         where id = @id;";
        await cnn.ExecuteAsync(query, key);
    }
}
