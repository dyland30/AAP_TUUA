using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class CashierMachineSessionReportDao
{
    private readonly string _cnx;

    public CashierMachineSessionReportDao(string cnx)
    {
        _cnx = cnx;
    }

    // El aeropuerto se toma del terminal de la caja o, si no tiene, de su sede.
    private const string ReportJoins = @"from public.cashier_machine_session as cms
                     left join public.cashier_machine as cm on cm.code = cms.cashier_machine_code
                     left join public.terminal as t on t.id = cm.terminal_id
                     left join public.location as l on l.id = cm.location_id
                     left join public.airport as a on a.id = coalesce(t.airport_id, l.airport_id)
                     left join public.local_user as u on u.id = cms.local_user_id
                     left join public.feature as st on st.id = cms.status_id
                     left join public.cashier_machine_session_closing as c on c.cashier_machine_session_id = cms.id";

    private const string ReportWhere = @"where cms.is_active = true
                and cms.start_time >= @dateFrom
                and cms.start_time < @dateToExclusive
                and (@airportId::uuid is null or a.id = @airportId::uuid)
                and (@terminalId::uuid is null or cm.terminal_id = @terminalId::uuid)";

    private const string ReportColumns = @"cms.id,
                         cms.cashier_machine_code,
                         cm.terminal_id,
                         t.name as terminal_name,
                         a.id as airport_id,
                         a.name as airport_name,
                         a.iata_code as airport_iata_code,
                         u.name as operator_name,
                         u.email as operator_email,
                         cms.start_time,
                         cms.end_time,
                         st.description as status_description,
                         (cms.end_time is not null) as is_closed,
                         c.has_difference as closing_has_difference,
                         c.observation as closing_observation";

    // Turnos filtrados, como conjunto para las consultas de totales.
    private const string FilteredSessions = $"select cms.id {ReportJoins} {ReportWhere}";

    // Turnos de una página o de la exportación, como conjunto para las consultas de detalle.
    private const string SelectedSessions = "select unnest(@ids::uuid[]) as id";

    private static object ReportParameters(CashierMachineSessionReportFilter filter, int limit, int offset) => new
    {
        dateFrom = filter.date_from!.Value.Date,
        dateToExclusive = filter.date_to!.Value.Date.AddDays(1),
        airportId = filter.airport_id,
        terminalId = filter.terminal_id,
        limit,
        offset
    };

    // Búsqueda paginada: un conteo con los mismos filtros, la página solicitada con su detalle y los totales
    // de todos los turnos filtrados.
    public async Task<(PagedResult<CashierMachineSessionReportItem> result, CashierMachineSessionReportTotals totals)>
        Search(CashierMachineSessionReportFilter filter)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var offset = (filter.page - 1) * filter.page_size;
        var parameters = ReportParameters(filter, filter.page_size, offset);

        var totals = await GetTotals(cnn, parameters);
        var items = totals.sessions_count == 0 || offset >= totals.sessions_count
            ? new List<CashierMachineSessionReportItem>()
            : await GetItems(cnn, parameters);

        return (new PagedResult<CashierMachineSessionReportItem>
        {
            items = items,
            total = totals.sessions_count,
            page = filter.page,
            page_size = filter.page_size
        }, totals);
    }

    // Mismos filtros que Search, sin paginar; se limita a maxRows turnos.
    public async Task<(List<CashierMachineSessionReportItem> items, CashierMachineSessionReportTotals totals)>
        Export(CashierMachineSessionReportFilter filter, int maxRows)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var parameters = ReportParameters(filter, maxRows, 0);
        var totals = await GetTotals(cnn, parameters);
        var items = totals.sessions_count == 0
            ? new List<CashierMachineSessionReportItem>()
            : await GetItems(cnn, parameters);
        return (items, totals);
    }

    private static async Task<List<CashierMachineSessionReportItem>> GetItems(IDbConnection cnn, object parameters)
    {
        var items = (await cnn.QueryAsync<CashierMachineSessionReportItem>(
            $@"select {ReportColumns}
              {ReportJoins}
              {ReportWhere}
              order by cms.start_time desc, cms.id desc
              limit @limit offset @offset", parameters)).ToList();
        if (items.Count == 0)
        {
            return items;
        }

        var ids = new { ids = items.Select(i => i.id).ToArray() };
        var tickets = await GetTickets(cnn, SelectedSessions, ids, true);
        var amounts = await GetAmounts(cnn, SelectedSessions, ids, true);
        var ticketsBySession = tickets.ToLookup(t => t.cashier_machine_session_id);
        var amountsBySession = amounts.ToLookup(a => a.cashier_machine_session_id);

        foreach (var item in items)
        {
            item.tickets = ticketsBySession[item.id].ToList();
            item.amounts = amountsBySession[item.id].ToList();
            item.sales_count = item.tickets.Sum(t => t.sales_count);
            item.tickets_count = item.tickets.Sum(t => t.tickets_count);
        }

        return items;
    }

    private static async Task<CashierMachineSessionReportTotals> GetTotals(IDbConnection cnn, object parameters)
    {
        var sessionsCount = await cnn.ExecuteScalarAsync<int>($"select count(*) {ReportJoins} {ReportWhere}", parameters);
        if (sessionsCount == 0)
        {
            return new CashierMachineSessionReportTotals();
        }

        var tickets = await GetTickets(cnn, FilteredSessions, parameters, false);
        return new CashierMachineSessionReportTotals
        {
            sessions_count = sessionsCount,
            sales_count = tickets.Sum(t => t.sales_count),
            tickets_count = tickets.Sum(t => t.tickets_count),
            tickets = tickets,
            amounts = await GetAmounts(cnn, FilteredSessions, parameters, false)
        };
    }

    // Tickets y ventas (sin anuladas) por tipo de vuelo, por turno o del conjunto completo.
    private static async Task<List<CashierMachineSessionReportTickets>> GetTickets(IDbConnection cnn, string sessions, object parameters,
        bool perSession)
    {
        var sessionKey = perSession ? "so.cashier_machine_session_id" : "null::uuid";
        var result = await cnn.QueryAsync<CashierMachineSessionReportTickets>(
            $@"with sessions as ({sessions})
              select {sessionKey} as cashier_machine_session_id,
                     so.flight_type_id,
                     count(*)::int as sales_count,
                     coalesce(sum(so.ticket_quantity), 0)::int as tickets_count
              from public.tuua_sales_operation as so
                   inner join sessions as s on s.id = so.cashier_machine_session_id
                   left join public.feature as f on f.id = so.status_id
              where trim(lower(coalesce(f.feature_value, ''))) <> 'anulado'
              group by 1, 2
              order by 1, 2", parameters);
        return result.ToList();
    }

    // Montos por moneda según cash_flow, más la diferencia declarada en el cuadre de los turnos cerrados.
    private static async Task<List<CashierMachineSessionReportAmounts>> GetAmounts(IDbConnection cnn, string sessions,
        object parameters, bool perSession)
    {
        var amountParameters = new DynamicParameters(parameters);
        amountParameters.Add("openingObservation", CashierMachineSessionClosingDao.OpeningObservation);
        var flowKey = perSession ? "cf.cashier_machine_session_id" : "null::uuid";
        var closingKey = perSession ? "c.cashier_machine_session_id" : "null::uuid";
        var result = await cnn.QueryAsync<CashierMachineSessionReportAmounts>(
            $@"with sessions as ({sessions}),
              flows as (
                  select {flowKey} as cashier_machine_session_id,
                         cf.currency_id,
                         coalesce(sum(cf.amount * cf.operator) filter (where cf.tuua_sales_operation_id is not null), 0) as sales_amount,
                         coalesce(sum(cf.amount) filter (where cf.is_manual and cf.direction = 'I'), 0) as income_amount,
                         coalesce(sum(cf.amount) filter (where cf.is_manual and cf.direction = 'E'), 0) as expense_amount,
                         coalesce(sum(cf.amount * cf.operator), 0) as balance_amount
                  from (select f.*,
                               (f.tuua_sales_operation_id is null and f.money_exchange_operation_id is null
                                   and f.observation is distinct from @openingObservation) as is_manual
                        from public.cash_flow as f
                             inner join sessions as s on s.id = f.cashier_machine_session_id
                        where f.is_active = true) as cf
                  group by 1, 2),
              differences as (
                  select {closingKey} as cashier_machine_session_id,
                         d.currency_id,
                         sum(d.difference_amount) as difference_amount
                  from public.cashier_machine_session_closing as c
                       inner join sessions as s on s.id = c.cashier_machine_session_id
                       inner join public.cashier_machine_session_closing_detail as d
                                  on d.cashier_machine_session_closing_id = c.id
                  group by 1, 2)
              select coalesce(fl.cashier_machine_session_id, di.cashier_machine_session_id) as cashier_machine_session_id,
                     coalesce(fl.currency_id, di.currency_id) as currency_id,
                     coalesce(fl.sales_amount, 0) as sales_amount,
                     coalesce(fl.income_amount, 0) as income_amount,
                     coalesce(fl.expense_amount, 0) as expense_amount,
                     coalesce(fl.balance_amount, 0) as balance_amount,
                     di.difference_amount
              from flows as fl
                   full join differences as di
                             on di.cashier_machine_session_id is not distinct from fl.cashier_machine_session_id
                            and di.currency_id = fl.currency_id
              order by 1, 2", amountParameters);
        return result.ToList();
    }
}
