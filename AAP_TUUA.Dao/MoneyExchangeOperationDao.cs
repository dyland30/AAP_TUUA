using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class MoneyExchangeOperationDao
{
    private readonly string _cnx;

    public MoneyExchangeOperationDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<MoneyExchangeOperation>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<MoneyExchangeOperation>(
            "select * from public.money_exchange_operation order by operation_date desc");
        return result.ToList();
    }

    public async Task<MoneyExchangeOperation?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<MoneyExchangeOperation>(
            "select * from public.money_exchange_operation where id = @id", new { id });
    }

    public async Task<List<MoneyExchangeOperation>> GetByCashierMachineSessionId(Guid cashierMachineSessionId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<MoneyExchangeOperation>(
            @"select * from public.money_exchange_operation
              where cashier_machine_session_id = @cashierMachineSessionId
              order by operation_date desc", new { cashierMachineSessionId });
        return result.ToList();
    }

    public async Task<List<MoneyExchangeOperation>> GetByExchangeRateId(Guid exchangeRateId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<MoneyExchangeOperation>(
            @"select * from public.money_exchange_operation
              where exchange_rate_id = @exchangeRateId
              order by operation_date desc", new { exchangeRateId });
        return result.ToList();
    }

    public async Task<MoneyExchangeOperation> Add(MoneyExchangeOperation moneyExchangeOperation, IReadOnlyCollection<CashFlow> cashFlows)
    {
        await using var cnn = new NpgsqlConnection(_cnx);
        await cnn.OpenAsync();
        await using var tx = await cnn.BeginTransactionAsync();

        try
        {
            moneyExchangeOperation.id = await cnn.QueryFirstOrDefaultAsync<Guid>(InsertQuery, moneyExchangeOperation, tx);

            foreach (var cashFlow in cashFlows)
            {
                cashFlow.money_exchange_operation_id = moneyExchangeOperation.id;
                cashFlow.id = await cnn.QueryFirstOrDefaultAsync<Guid>(CashFlowDao.InsertQuery, cashFlow, tx);
            }

            await tx.CommitAsync();
            return moneyExchangeOperation;
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    public async Task Update(MoneyExchangeOperation moneyExchangeOperation)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.money_exchange_operation
                         set cashier_machine_session_id = @cashier_machine_session_id,
                             operation_date = @operation_date,
                             operation_type = @operation_type,
                             local_currency_id = @local_currency_id,
                             foreign_currency_id = @foreign_currency_id,
                             exchange_rate_id = @exchange_rate_id,
                             applied_exchange_rate = @applied_exchange_rate,
                             local_currency_amount = @local_currency_amount,
                             foreign_currency_amount = @foreign_currency_amount,
                             updated_at = @updated_at,
                             modified_by = @modified_by
                         where id = @id;";
        await cnn.ExecuteAsync(query, moneyExchangeOperation);
    }

    public async Task Delete(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync("delete from public.money_exchange_operation where id = @id", new { id });
    }

    private const string InsertQuery = @"insert into public.money_exchange_operation (cashier_machine_session_id,
                             operation_date, operation_type, local_currency_id, foreign_currency_id,
                             exchange_rate_id, applied_exchange_rate,
                             local_currency_amount, foreign_currency_amount,
                             created_at, updated_at, created_by, modified_by)
                         values (@cashier_machine_session_id,
                             @operation_date, @operation_type, @local_currency_id, @foreign_currency_id,
                             @exchange_rate_id, @applied_exchange_rate,
                             @local_currency_amount, @foreign_currency_amount,
                             @created_at, @updated_at, @created_by, @modified_by)
                         returning id;";
}
