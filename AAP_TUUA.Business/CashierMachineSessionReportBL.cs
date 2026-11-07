using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class CashierMachineSessionReportBL
{
    private const int MaxSearchDays = 92;
    private const int MaxPageSize = 100;
    private const int MaxExportRows = 20000;
    private const string CurrencyGroupName = "Monedas";
    private const string FlightTypeGroupName = "Tipos de Vuelo";

    private readonly CashierMachineSessionReportDao _reportDao;
    private readonly FeatureDao _featureDao;
    private readonly AirportDao _airportDao;
    private readonly TerminalDao _terminalDao;

    public CashierMachineSessionReportBL(string cnx)
    {
        _reportDao = new CashierMachineSessionReportDao(cnx);
        _featureDao = new FeatureDao(cnx);
        _airportDao = new AirportDao(cnx);
        _terminalDao = new TerminalDao(cnx);
    }

    public async Task<CashierMachineSessionReport> Search(CashierMachineSessionReportFilter filter)
    {
        ValidateFilter(filter);

        filter.page = Math.Max(1, filter.page);
        filter.page_size = Math.Clamp(filter.page_size, 1, MaxPageSize);

        var (result, totals) = await _reportDao.Search(filter);
        return new CashierMachineSessionReport
        {
            result = result,
            totals = totals,
            currencies = await GetColumns(CurrencyGroupName, totals.amounts.Select(a => (int?)a.currency_id)),
            flight_types = await GetColumns(FlightTypeGroupName, totals.tickets.Select(t => t.flight_type_id))
        };
    }

    // Exporta a Excel todos los turnos que cumplen los filtros (sin paginar), hasta MaxExportRows.
    public async Task<byte[]> Export(CashierMachineSessionReportFilter filter)
    {
        ValidateFilter(filter);

        var (items, totals) = await _reportDao.Export(filter, MaxExportRows + 1);
        if (items.Count > MaxExportRows)
        {
            throw new Exception($"The export exceeds {MaxExportRows} rows; narrow the filters");
        }

        var currencies = await GetColumns(CurrencyGroupName, totals.amounts.Select(a => (int?)a.currency_id));
        var flightTypes = await GetColumns(FlightTypeGroupName, totals.tickets.Select(t => t.flight_type_id));

        return CashierMachineSessionReportExcelBL.Generate(items, totals, currencies, flightTypes,
            await DescribeFilter(filter));
    }

    // Columnas del reporte: los valores del catálogo (activos o no) que aparecen en los turnos filtrados.
    private async Task<List<Feature>> GetColumns(string groupName, IEnumerable<int?> usedIds)
    {
        var ids = usedIds.Where(id => id.HasValue).Select(id => id!.Value).ToHashSet();
        if (ids.Count == 0)
        {
            return new List<Feature>();
        }

        var groupId = await _featureDao.GetFeatureGroupIdByName(groupName);
        var features = groupId is null ? null : await _featureDao.GetByFeatureGroup(groupId.Value);
        var known = (features ?? new List<Feature>()).Where(f => ids.Contains(f.id)).OrderBy(f => f.id).ToList();

        // un id fuera del catálogo se muestra igual, con su número como descripción
        known.AddRange(ids.Where(id => known.All(f => f.id != id)).Order()
            .Select(id => new Feature { id = id, description = id.ToString() }));
        return known;
    }

    private async Task<string> DescribeFilter(CashierMachineSessionReportFilter filter)
    {
        var parts = new List<string>
        {
            $"Apertura del {filter.date_from!.Value:dd/MM/yyyy} al {filter.date_to!.Value:dd/MM/yyyy}"
        };

        if (filter.airport_id is not null)
        {
            var airport = await _airportDao.GetById(filter.airport_id.Value);
            parts.Add($"Aeropuerto: {airport?.iata_code ?? airport?.name ?? filter.airport_id.ToString()}");
        }

        if (filter.terminal_id is not null)
        {
            var terminal = await _terminalDao.GetById(filter.terminal_id.Value);
            parts.Add($"Terminal: {terminal?.name ?? filter.terminal_id.ToString()}");
        }

        return string.Join(" · ", parts);
    }

    private static void ValidateFilter(CashierMachineSessionReportFilter filter)
    {
        if (filter.date_from is null || filter.date_to is null)
        {
            throw new Exception("The date range is required");
        }

        if (filter.date_from.Value.Date > filter.date_to.Value.Date)
        {
            throw new Exception("The start date cannot be after the end date");
        }

        if ((filter.date_to.Value.Date - filter.date_from.Value.Date).TotalDays > MaxSearchDays)
        {
            throw new Exception($"The date range cannot exceed {MaxSearchDays} days");
        }
    }
}
