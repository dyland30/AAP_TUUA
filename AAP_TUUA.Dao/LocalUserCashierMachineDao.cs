using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class LocalUserCashierMachineDao
{
    private readonly string _cnx;

    public LocalUserCashierMachineDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<LocalUserCashierMachine>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<LocalUserCashierMachine>(
            "select * from public.local_user_cashier_machine order by created_at desc");
        return result.ToList();
    }

    public async Task<List<LocalUserCashierMachine>> GetByLocalUserId(Guid localUserId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<LocalUserCashierMachine>(
            @"select * from public.local_user_cashier_machine
              where local_user_id = @localUserId
              order by cashier_machine_code", new { localUserId });
        return result.ToList();
    }

    public async Task<List<LocalUserCashierMachine>> GetByCashierMachineCode(string cashierMachineCode)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<LocalUserCashierMachine>(
            @"select * from public.local_user_cashier_machine
              where cashier_machine_code = @cashierMachineCode
              order by created_at desc", new { cashierMachineCode });
        return result.ToList();
    }

    public async Task<LocalUserCashierMachine?> Get(Guid localUserId, string cashierMachineCode)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<LocalUserCashierMachine>(
            @"select * from public.local_user_cashier_machine
              where local_user_id = @localUserId
                and cashier_machine_code = @cashierMachineCode
              limit 1", new { localUserId, cashierMachineCode });
    }

    public async Task<LocalUserCashierMachine> Add(LocalUserCashierMachine assignment)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.local_user_cashier_machine (local_user_id, cashier_machine_code,
                             created_at, updated_at, created_by, modified_by)
                         values (@local_user_id, @cashier_machine_code,
                             @created_at, @updated_at, @created_by, @modified_by);";
        await cnn.ExecuteAsync(query, assignment);
        return assignment;
    }

    public async Task Delete(Guid localUserId, string cashierMachineCode)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync(
            @"delete from public.local_user_cashier_machine
              where local_user_id = @localUserId
                and cashier_machine_code = @cashierMachineCode",
            new { localUserId, cashierMachineCode });
    }
}
