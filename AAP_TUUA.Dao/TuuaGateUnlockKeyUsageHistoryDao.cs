using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class TuuaGateUnlockKeyUsageHistoryDao
{
    private readonly string _cnx;

    public TuuaGateUnlockKeyUsageHistoryDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<TuuaGateUnlockKeyUsageHistory>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<TuuaGateUnlockKeyUsageHistory>(
            "select * from public.tuua_gate_unlock_keys_usage_history order by usage_date desc");
        return result.ToList();
    }

    public async Task<TuuaGateUnlockKeyUsageHistory?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<TuuaGateUnlockKeyUsageHistory>(
            "select * from public.tuua_gate_unlock_keys_usage_history where id = @id", new { id });
    }

    public async Task<List<TuuaGateUnlockKeyUsageHistory>> GetByTuuaGateCode(string tuuaGateCode)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<TuuaGateUnlockKeyUsageHistory>(
            @"select * from public.tuua_gate_unlock_keys_usage_history
              where tuua_gate_code = @tuuaGateCode order by usage_date desc", new { tuuaGateCode });
        return result.ToList();
    }

    // El usuario es el dueño de la llave de destrabe utilizada.
    private const string ReportJoins = @"from public.tuua_gate_unlock_keys_usage_history as h
                     inner join public.tuua_gate as g on g.code = h.tuua_gate_code
                     left join public.terminal as t on t.id = g.terminal_id
                     left join public.airport as a on a.id = t.airport_id
                     left join public.tuua_gate_unlock_keys as k on k.id = h.tuua_gate_unlock_keys_id
                     left join public.feature as kt on kt.id = k.type_id
                     left join public.local_user as u on u.id = k.user_id";

    private const string ReportWhere = @"where h.usage_date >= @dateFrom
                and h.usage_date < @dateToExclusive
                and (@airportId::uuid is null or t.airport_id = @airportId::uuid)
                and (@terminalId::uuid is null or g.terminal_id = @terminalId::uuid)
                and (@tuuaGateCode::text is null or h.tuua_gate_code = @tuuaGateCode::text)
                and (@userId::uuid is null or u.id = @userId::uuid)";

    private const string ReportColumns = @"h.*,
                         g.description as tuua_gate_description,
                         g.terminal_id,
                         t.name as terminal_name,
                         t.airport_id,
                         a.name as airport_name,
                         a.iata_code as airport_iata_code,
                         k.code as key_code,
                         kt.description as key_type_description,
                         u.id as user_id,
                         u.name as user_name,
                         u.email as user_email";

    private static object ReportParameters(TuuaGateUnlockKeyUsageFilter filter, int limit, int offset) => new
    {
        dateFrom = filter.date_from!.Value.Date,
        dateToExclusive = filter.date_to!.Value.Date.AddDays(1),
        airportId = filter.airport_id,
        terminalId = filter.terminal_id,
        tuuaGateCode = string.IsNullOrWhiteSpace(filter.tuua_gate_code) ? null : filter.tuua_gate_code.Trim(),
        userId = filter.user_id,
        limit,
        offset
    };

    // Búsqueda paginada en base de datos: un único conteo con los mismos filtros y solo la página solicitada.
    public async Task<PagedResult<TuuaGateUnlockKeyUsageReportItem>> Search(TuuaGateUnlockKeyUsageFilter filter)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var offset = (filter.page - 1) * filter.page_size;
        var parameters = ReportParameters(filter, filter.page_size, offset);

        var total = await cnn.ExecuteScalarAsync<int>($"select count(*) {ReportJoins} {ReportWhere}", parameters);
        var items = total == 0 || offset >= total
            ? new List<TuuaGateUnlockKeyUsageReportItem>()
            : (await cnn.QueryAsync<TuuaGateUnlockKeyUsageReportItem>(
                $@"select {ReportColumns}
                  {ReportJoins}
                  {ReportWhere}
                  order by h.usage_date desc, h.id desc
                  limit @limit offset @offset", parameters)).ToList();

        return new PagedResult<TuuaGateUnlockKeyUsageReportItem>
        {
            items = items,
            total = total,
            page = filter.page,
            page_size = filter.page_size
        };
    }

    // Mismos filtros que Search, sin paginar; se limita a maxRows filas.
    public async Task<List<TuuaGateUnlockKeyUsageReportItem>> Export(TuuaGateUnlockKeyUsageFilter filter, int maxRows)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<TuuaGateUnlockKeyUsageReportItem>(
            $@"select {ReportColumns}
              {ReportJoins}
              {ReportWhere}
              order by h.usage_date desc, h.id desc
              limit @limit", ReportParameters(filter, maxRows, 0));
        return result.ToList();
    }

    public async Task<TuuaGateUnlockKeyUsageHistory> Add(TuuaGateUnlockKeyUsageHistory history)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.tuua_gate_unlock_keys_usage_history (tuua_gate_unlock_keys_id, usage_date, tuua_gate_code,
                             created_at, updated_at, created_by, modified_by)
                         values (@tuua_gate_unlock_keys_id, @usage_date, @tuua_gate_code,
                             @created_at, @updated_at, @created_by, @modified_by)
                         returning id;";
        history.id = await cnn.QueryFirstOrDefaultAsync<Guid>(query, history);
        return history;
    }
}
