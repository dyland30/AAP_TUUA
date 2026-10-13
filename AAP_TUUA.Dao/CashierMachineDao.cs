using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class CashierMachineDao
{
    private readonly string _cnx;

    public CashierMachineDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<CashierMachine>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<CashierMachine>(
            "select * from public.cashier_machine order by code");
        return result.ToList();
    }

    public async Task<CashierMachine?> GetByCode(string code)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<CashierMachine>(
            "select * from public.cashier_machine where code = @code", new { code });
    }

    public async Task<List<string>> GetCodesByPrefix(string prefix)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<string>(
            "select code from public.cashier_machine where code like @pattern", new { pattern = prefix + "%" });
        return result.ToList();
    }

    public async Task<CashierMachine> Add(CashierMachine cashierMachine)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.cashier_machine (code, location_id, terminal_id, is_active,
                             created_at, updated_at, created_by, modified_by)
                         values (@code, @location_id, @terminal_id, @is_active,
                             @created_at, @updated_at, @created_by, @modified_by)
                         returning code;";
        cashierMachine.code = await cnn.QueryFirstOrDefaultAsync<string>(query, cashierMachine);
        return cashierMachine;
    }

    public async Task Update(CashierMachine cashierMachine)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.cashier_machine
                         set location_id = @location_id,
                             terminal_id = @terminal_id,
                             is_active = @is_active,
                             updated_at = @updated_at,
                             modified_by = @modified_by
                         where code = @code;";
        await cnn.ExecuteAsync(query, cashierMachine);
    }
}
