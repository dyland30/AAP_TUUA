using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class CashierMachineSessionClosingDao
{
    // Observación con la que la apertura de turno registra los montos iniciales.
    internal const string OpeningObservation = "Monto inicial de apertura de turno";

    private readonly string _cnx;

    public CashierMachineSessionClosingDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<CashierMachineSessionClosing?> GetBySessionId(Guid cashierMachineSessionId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var closing = await cnn.QueryFirstOrDefaultAsync<CashierMachineSessionClosing>(
            @"select * from public.cashier_machine_session_closing
              where cashier_machine_session_id = @cashierMachineSessionId", new { cashierMachineSessionId });
        if (closing is null)
        {
            return null;
        }

        var details = await cnn.QueryAsync<CashierMachineSessionClosingDetail>(
            @"select * from public.cashier_machine_session_closing_detail
              where cashier_machine_session_closing_id = @id
              order by currency_id, payment_type_id", new { closing.id });
        closing.details = details.ToList();
        return closing;
    }

    // Saldo de cada moneda / tipo de pago según los movimientos activos del turno.
    public async Task<List<CashierMachineSessionExpectedAmount>> GetExpectedAmounts(Guid cashierMachineSessionId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await GetExpectedAmounts(cnn, cashierMachineSessionId, null);
    }

    public async Task<List<CashierMachineSessionCurrencyTotals>> GetCurrencyTotals(Guid cashierMachineSessionId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<CashierMachineSessionCurrencyTotals>(
            @"select currency_id,
                     coalesce(sum(amount * operator) filter (where is_opening), 0) as opening_amount,
                     coalesce(sum(amount * operator) filter (where tuua_sales_operation_id is not null), 0) as sales_amount,
                     coalesce(sum(amount * operator) filter (where money_exchange_operation_id is not null), 0) as exchange_amount,
                     coalesce(sum(amount) filter (where is_manual and direction = 'I'), 0) as income_amount,
                     coalesce(sum(amount) filter (where is_manual and direction = 'E'), 0) as expense_amount,
                     coalesce(sum(amount * operator), 0) as balance_amount
              from (select cf.*,
                           (cf.tuua_sales_operation_id is null and cf.money_exchange_operation_id is null
                               and cf.observation = @OpeningObservation) as is_opening,
                           (cf.tuua_sales_operation_id is null and cf.money_exchange_operation_id is null
                               and cf.observation is distinct from @OpeningObservation) as is_manual
                    from public.cash_flow as cf
                    where cf.cashier_machine_session_id = @cashierMachineSessionId
                      and cf.is_active = true) as flows
              group by currency_id
              order by currency_id", new { cashierMachineSessionId, OpeningObservation });
        return result.ToList();
    }

    // Cantidad de ventas y tickets del turno, sin contar las anuladas.
    public async Task<(int sales, int tickets)> GetSalesCounts(Guid cashierMachineSessionId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var counts = await cnn.QuerySingleAsync<SalesCounts>(
            @"select count(*)::int as sales_count, coalesce(sum(so.ticket_quantity), 0)::int as tickets_count
              from public.tuua_sales_operation as so
              left join public.feature as f on f.id = so.status_id
              where so.cashier_machine_session_id = @cashierMachineSessionId
                and trim(lower(coalesce(f.feature_value, ''))) <> 'anulado'", new { cashierMachineSessionId });
        return (counts.sales_count, counts.tickets_count);
    }

    private sealed class SalesCounts
    {
        public int sales_count { get; set; }
        public int tickets_count { get; set; }
    }

    // Cierra el turno en una sola transacción: bloquea el turno, verifica que siga abierto, recalcula los
    // saldos esperados (buildClosing arma el cuadre con ellos), registra el cuadre y marca el turno como cerrado.
    public async Task<CashierMachineSessionClosing> Close(Guid cashierMachineSessionId, int openStatusId,
        int closedStatusId, Func<List<CashierMachineSessionExpectedAmount>, CashierMachineSessionClosing> buildClosing)
    {
        await using var cnn = new NpgsqlConnection(_cnx);
        await cnn.OpenAsync();
        await using var tx = await cnn.BeginTransactionAsync();

        try
        {
            var session = await cnn.QueryFirstOrDefaultAsync<CashierMachineSession>(
                "select * from public.cashier_machine_session where id = @cashierMachineSessionId for update",
                new { cashierMachineSessionId }, tx);
            if (session is null || !session.is_active)
            {
                throw new Exception("Cashier machine session not found");
            }

            if (session.end_time is not null || session.status_id != openStatusId)
            {
                throw new Exception("The cashier machine session is already closed");
            }

            var expected = await GetExpectedAmounts(cnn, cashierMachineSessionId, tx);
            var closing = buildClosing(expected);

            closing.id = await cnn.QuerySingleAsync<Guid>(
                @"insert into public.cashier_machine_session_closing (cashier_machine_session_id, closing_date,
                      has_difference, observation, created_at, updated_at, created_by, modified_by)
                  values (@cashier_machine_session_id, @closing_date,
                      @has_difference, @observation, @created_at, @updated_at, @created_by, @modified_by)
                  returning id;", closing, tx);

            foreach (var detail in closing.details)
            {
                detail.cashier_machine_session_closing_id = closing.id;
                detail.id = await cnn.QuerySingleAsync<Guid>(
                    @"insert into public.cashier_machine_session_closing_detail (cashier_machine_session_closing_id,
                          currency_id, payment_type_id, expected_amount, declared_amount, difference_amount,
                          created_at, updated_at, created_by, modified_by)
                      values (@cashier_machine_session_closing_id,
                          @currency_id, @payment_type_id, @expected_amount, @declared_amount, @difference_amount,
                          @created_at, @updated_at, @created_by, @modified_by)
                      returning id;", detail, tx);
            }

            await cnn.ExecuteAsync(
                @"update public.cashier_machine_session
                  set end_time = @closing_date,
                      status_id = @closedStatusId,
                      updated_at = @updated_at,
                      modified_by = @modified_by
                  where id = @cashierMachineSessionId;",
                new { closing.closing_date, closedStatusId, closing.updated_at, closing.modified_by, cashierMachineSessionId },
                tx);

            await tx.CommitAsync();
            return closing;
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    private static async Task<List<CashierMachineSessionExpectedAmount>> GetExpectedAmounts(IDbConnection cnn,
        Guid cashierMachineSessionId, IDbTransaction? tx)
    {
        var result = await cnn.QueryAsync<CashierMachineSessionExpectedAmount>(
            @"select currency_id, payment_type_id, sum(amount * operator) as expected_amount
              from public.cash_flow
              where cashier_machine_session_id = @cashierMachineSessionId
                and is_active = true
              group by currency_id, payment_type_id
              order by currency_id, payment_type_id", new { cashierMachineSessionId }, tx);
        return result.ToList();
    }
}
