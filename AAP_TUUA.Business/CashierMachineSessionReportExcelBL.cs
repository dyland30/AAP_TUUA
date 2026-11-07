using AAP_TUUA.Entidades;
using ClosedXML.Excel;

namespace AAP_TUUA.Business;

public static class CashierMachineSessionReportExcelBL
{
    private const int HeaderRow = 4;
    private const string AmountFormat = "#,##0.00;-#,##0.00";

    private static readonly string[] FixedHeaders =
    [
        "Caja", "Aeropuerto", "Terminal", "Operador", "Correo", "Apertura", "Cierre", "Estado", "Cuadre",
        "Ventas", "Tickets"
    ];

    private static readonly string[] AmountHeaders = ["Ventas", "Ingresos", "Egresos", "Saldo", "Diferencia"];

    // Una fila por turno con columnas de tickets por tipo de vuelo y de montos por moneda, y una fila de totales.
    public static byte[] Generate(IReadOnlyList<CashierMachineSessionReportItem> rows,
        CashierMachineSessionReportTotals totals, IReadOnlyList<Feature> currencies,
        IReadOnlyList<Feature> flightTypes, string filterDescription)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("Turnos");

        var headers = new List<string>(FixedHeaders);
        headers.AddRange(flightTypes.Select(f => $"Tickets {f.description}"));
        foreach (var currency in currencies)
        {
            var code = CurrencyCode(currency);
            headers.AddRange(AmountHeaders.Select(h => $"{h} {code}"));
        }
        headers.Add("Observación cuadre");

        sheet.Cell(1, 1).Value = "Reporte de turnos de caja";
        sheet.Cell(1, 1).Style.Font.Bold = true;
        sheet.Cell(1, 1).Style.Font.FontSize = 14;
        sheet.Cell(2, 1).Value = $"{filterDescription} · Generado: {DateTime.Now:dd/MM/yyyy HH:mm}";

        for (var c = 0; c < headers.Count; c++)
        {
            sheet.Cell(HeaderRow, c + 1).Value = headers[c];
        }

        var header = sheet.Range(HeaderRow, 1, HeaderRow, headers.Count);
        header.Style.Font.Bold = true;
        header.Style.Fill.BackgroundColor = XLColor.LightGray;

        for (var i = 0; i < rows.Count; i++)
        {
            var r = rows[i];
            var row = HeaderRow + 1 + i;
            var c = 1;
            sheet.Cell(row, c++).Value = r.cashier_machine_code;
            sheet.Cell(row, c++).Value = r.airport_iata_code ?? r.airport_name;
            sheet.Cell(row, c++).Value = r.terminal_name;
            sheet.Cell(row, c++).Value = r.operator_name;
            sheet.Cell(row, c++).Value = r.operator_email;
            sheet.Cell(row, c++).Value = r.start_time;
            if (r.end_time is not null)
            {
                sheet.Cell(row, c).Value = r.end_time.Value;
            }
            c++;
            sheet.Cell(row, c++).Value = r.status_description;
            sheet.Cell(row, c++).Value = ClosingLabel(r);
            sheet.Cell(row, c++).Value = r.sales_count;
            sheet.Cell(row, c++).Value = r.tickets_count;
            WriteDetails(sheet, row, ref c, r.tickets, r.amounts, currencies, flightTypes, true);
            sheet.Cell(row, c).Value = r.closing_observation;
        }

        var totalRow = HeaderRow + 1 + rows.Count;
        var t = 1;
        sheet.Cell(totalRow, t).Value = $"TOTAL ({totals.sessions_count} turnos)";
        t = FixedHeaders.Length - 1;
        sheet.Cell(totalRow, t++).Value = totals.sales_count;
        sheet.Cell(totalRow, t++).Value = totals.tickets_count;
        WriteDetails(sheet, totalRow, ref t, totals.tickets, totals.amounts, currencies, flightTypes, false);
        var totalRange = sheet.Range(totalRow, 1, totalRow, headers.Count);
        totalRange.Style.Font.Bold = true;
        totalRange.Style.Border.TopBorder = XLBorderStyleValues.Thin;

        sheet.Column(6).Style.DateFormat.Format = "dd/MM/yyyy HH:mm";
        sheet.Column(7).Style.DateFormat.Format = "dd/MM/yyyy HH:mm";
        var firstAmountColumn = FixedHeaders.Length + flightTypes.Count + 1;
        var lastAmountColumn = firstAmountColumn + currencies.Count * AmountHeaders.Length - 1;
        if (lastAmountColumn >= firstAmountColumn)
        {
            sheet.Range(HeaderRow + 1, firstAmountColumn, totalRow, lastAmountColumn)
                .Style.NumberFormat.Format = AmountFormat;
        }

        sheet.SheetView.FreezeRows(HeaderRow);
        sheet.Range(HeaderRow, 1, Math.Max(HeaderRow, totalRow - 1), headers.Count).SetAutoFilter();
        sheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    // Tickets por tipo de vuelo y, por moneda, ventas / ingresos / egresos / saldo / diferencia del cuadre.
    private static void WriteDetails(IXLWorksheet sheet, int row, ref int column,
        List<CashierMachineSessionReportTickets> tickets, List<CashierMachineSessionReportAmounts> amounts,
        IReadOnlyList<Feature> currencies, IReadOnlyList<Feature> flightTypes, bool blankMissingDifference)
    {
        foreach (var flightType in flightTypes)
        {
            sheet.Cell(row, column++).Value = tickets.Where(x => x.flight_type_id == flightType.id).Sum(x => x.tickets_count);
        }

        foreach (var currency in currencies)
        {
            var amount = amounts.FirstOrDefault(a => a.currency_id == currency.id);
            sheet.Cell(row, column++).Value = amount?.sales_amount ?? 0;
            sheet.Cell(row, column++).Value = amount?.income_amount ?? 0;
            sheet.Cell(row, column++).Value = amount?.expense_amount ?? 0;
            sheet.Cell(row, column++).Value = amount?.balance_amount ?? 0;
            if (amount?.difference_amount is not null || !blankMissingDifference)
            {
                sheet.Cell(row, column).Value = amount?.difference_amount ?? 0;
            }
            column++;
        }
    }

    private static string ClosingLabel(CashierMachineSessionReportItem item)
    {
        if (item.closing_has_difference is null)
        {
            return item.is_closed ? "Sin cuadre" : "Pendiente";
        }

        return item.closing_has_difference.Value ? "Con diferencia" : "Sin diferencia";
    }

    private static string CurrencyCode(Feature currency)
    {
        return currency.feature_value ?? currency.abbreviation ?? currency.description ?? currency.id.ToString();
    }
}
