using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class CashierMachineSessionDao
{
    private readonly string _cnx;

    public CashierMachineSessionDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<CashierMachineSession>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<CashierMachineSession>(
            "select * from public.cashier_machine_session order by start_time desc");
        return result.ToList();
    }

    public async Task<CashierMachineSession?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<CashierMachineSession>(
            "select * from public.cashier_machine_session where id = @id", new { id });
    }

    public async Task<CashierMachineSession?> GetOpenByCashierMachineCode(string cashierMachineCode)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<CashierMachineSession>(
            @"select * from public.cashier_machine_session
              where cashier_machine_code = @cashierMachineCode
                and end_time is null
                and is_active = true
              order by start_time desc
              limit 1", new { cashierMachineCode });
    }

    public async Task<List<CashierMachineSession>> GetByLocalUserId(Guid localUserId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<CashierMachineSession>(
            @"select * from public.cashier_machine_session
              where local_user_id = @localUserId
              order by start_time desc", new { localUserId });
        return result.ToList();
    }

    public async Task<CashierMachineSession> Add(CashierMachineSession session)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.cashier_machine_session (cashier_machine_code, local_user_id,
                             start_time, end_time, status_id, is_active,
                             created_at, updated_at, created_by, modified_by)
                         values (@cashier_machine_code, @local_user_id,
                             @start_time, @end_time, @status_id, @is_active,
                             @created_at, @updated_at, @created_by, @modified_by)
                         returning id;";
        session.id = await cnn.QueryFirstOrDefaultAsync<Guid>(query, session);
        return session;
    }

    public async Task Update(CashierMachineSession session)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.cashier_machine_session
                         set cashier_machine_code = @cashier_machine_code,
                             local_user_id = @local_user_id,
                             start_time = @start_time,
                             end_time = @end_time,
                             status_id = @status_id,
                             is_active = @is_active,
                             updated_at = @updated_at,
                             modified_by = @modified_by
                         where id = @id;";
        await cnn.ExecuteAsync(query, session);
    }
}
