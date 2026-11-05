using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class CashFlowDao
{
    private readonly string _cnx;

    public CashFlowDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<CashFlow>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<CashFlow>(
            "select * from public.cash_flow order by created_at desc, id desc");
        return result.ToList();
    }

    public async Task<CashFlow?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<CashFlow>(
            "select * from public.cash_flow where id = @id", new { id });
    }

    public async Task<List<CashFlow>> GetByCashierMachineSessionId(Guid cashierMachineSessionId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<CashFlow>(
            @"select * from public.cash_flow
              where cashier_machine_session_id = @cashierMachineSessionId
              order by created_at desc", new { cashierMachineSessionId });
        return result.ToList();
    }

    public async Task<List<CashFlow>> GetBySalesOperationId(Guid tuuaSalesOperationId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<CashFlow>(
            @"select * from public.cash_flow
              where tuua_sales_operation_id = @tuuaSalesOperationId
              order by created_at desc", new { tuuaSalesOperationId });
        return result.ToList();
    }

    public async Task<List<CashFlow>> GetByMoneyExchangeOperationId(Guid moneyExchangeOperationId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<CashFlow>(
            @"select * from public.cash_flow
              where money_exchange_operation_id = @moneyExchangeOperationId
              order by created_at desc", new { moneyExchangeOperationId });
        return result.ToList();
    }

    public async Task<CashFlow> Add(CashFlow cashFlow)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        cashFlow.id = await cnn.QueryFirstOrDefaultAsync<Guid>(InsertQuery, cashFlow);
        return cashFlow;
    }

    public async Task Update(CashFlow cashFlow)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.cash_flow
                         set cashier_machine_session_id = @cashier_machine_session_id,
                             tuua_sales_operation_id = @tuua_sales_operation_id,
                             money_exchange_operation_id = @money_exchange_operation_id,
                             direction = @direction,
                             ""operator"" = @operator,
                             payment_type_id = @payment_type_id,
                             currency_id = @currency_id,
                             amount = @amount,
                             reference_code = @reference_code,
                             observation = @observation,
                             is_active = @is_active,
                             updated_at = @updated_at,
                             modified_by = @modified_by
                         where id = @id;";
        await cnn.ExecuteAsync(query, cashFlow);
    }

    internal const string InsertQuery = @"insert into public.cash_flow (cashier_machine_session_id, tuua_sales_operation_id,
                             money_exchange_operation_id,
                             direction, ""operator"", payment_type_id, currency_id, amount,
                             reference_code, observation, is_active,
                             created_at, updated_at, created_by, modified_by)
                         values (@cashier_machine_session_id, @tuua_sales_operation_id,
                             @money_exchange_operation_id,
                             @direction, @operator, @payment_type_id, @currency_id, @amount,
                             @reference_code, @observation, @is_active,
                             @created_at, @updated_at, @created_by, @modified_by)
                         returning id;";
}
