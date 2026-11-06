using AAP_TUUA.Entidades;
using ClosedXML.Excel;

namespace AAP_TUUA.Business;

public static class BoardingpassExcelBL
{
    private static readonly string[] Headers =
    [
        "Fecha registro", "Serie", "Correlativo", "Aeropuerto", "Terminal", "Puerta TUUA", "Pasajero", "PNR",
        "Vuelo", "Fecha vuelo", "Origen", "Destino", "Asiento", "Sec. check-in", "Tipo de vuelo", "Moneda",
        "Precio", "Estado", "Estado OSE"
    ];

    public static byte[] Generate(IReadOnlyList<BoardingpassExportItem> rows)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("Boardingpass");

        for (var c = 0; c < Headers.Length; c++)
        {
            sheet.Cell(1, c + 1).Value = Headers[c];
        }

        var header = sheet.Range(1, 1, 1, Headers.Length);
        header.Style.Font.Bold = true;
        header.Style.Fill.BackgroundColor = XLColor.LightGray;

        for (var i = 0; i < rows.Count; i++)
        {
            var r = rows[i];
            var row = i + 2;
            var c = 1;
            sheet.Cell(row, c++).Value = r.created_at;
            sheet.Cell(row, c++).Value = r.serial;
            sheet.Cell(row, c++).Value = r.sequential_number;
            sheet.Cell(row, c++).Value = r.airport_iata_code ?? r.airport_name;
            sheet.Cell(row, c++).Value = r.terminal_name;
            sheet.Cell(row, c++).Value = r.tuua_gate_code;
            sheet.Cell(row, c++).Value = r.passenger_name;
            sheet.Cell(row, c++).Value = r.pnr;
            sheet.Cell(row, c++).Value = r.flight_number;
            sheet.Cell(row, c++).Value = r.flight_date;
            sheet.Cell(row, c++).Value = r.origin_airport_code;
            sheet.Cell(row, c++).Value = r.destination_airport_code;
            sheet.Cell(row, c++).Value = r.seat_number;
            sheet.Cell(row, c++).Value = r.checkin_sequence_number;
            sheet.Cell(row, c++).Value = r.flight_type_description;
            sheet.Cell(row, c++).Value = r.currency_code;
            sheet.Cell(row, c++).Value = r.price;
            sheet.Cell(row, c++).Value = r.status_description;
            sheet.Cell(row, c).Value = r.ose_status_description;
        }

        sheet.Column(1).Style.DateFormat.Format = "dd/MM/yyyy HH:mm";
        sheet.Column(10).Style.DateFormat.Format = "dd/MM/yyyy";
        sheet.Column(17).Style.NumberFormat.Format = "#,##0.00";
        sheet.SheetView.FreezeRows(1);
        sheet.Range(1, 1, Math.Max(1, rows.Count + 1), Headers.Length).SetAutoFilter();
        sheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }
}
