using System.Globalization;
using AAP_TUUA.Business.Util;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;
using MigraDoc.DocumentObjectModel;
using MigraDoc.Rendering;
using PdfSharp.Drawing;
using QRCoder;

namespace AAP_TUUA.Business;

// Genera el PDF de los tickets TUUA de una venta: una página por ticket, en formato de rollo de 80 mm.
public class TuuaTicketPdfBL
{
    private const string AccountingParametersGroupName = "Parametros Contables";
    private const double QrSizeMm = 38;

    private readonly TuuaSalesOperationBL _tuuaSalesOperationBl;
    private readonly FlightDao _flightDao;
    private readonly FeatureDao _featureDao;
    private readonly CashierMachineSessionDao _cashierMachineSessionDao;
    private readonly CashierMachineDao _cashierMachineDao;
    private readonly TerminalDao _terminalDao;
    private readonly AirportDao _airportDao;

    public TuuaTicketPdfBL(string cnx)
    {
        _tuuaSalesOperationBl = new TuuaSalesOperationBL(cnx);
        _flightDao = new FlightDao(cnx);
        _featureDao = new FeatureDao(cnx);
        _cashierMachineSessionDao = new CashierMachineSessionDao(cnx);
        _cashierMachineDao = new CashierMachineDao(cnx);
        _terminalDao = new TerminalDao(cnx);
        _airportDao = new AirportDao(cnx);
        SystemFontResolver.Register();
    }

    public async Task<TuuaSalesOperation> GetSalesOperation(Guid salesOperationId)
    {
        var salesOperation = await _tuuaSalesOperationBl.GetByIdWithTickets(salesOperationId)
                             ?? throw new Exception("Tuua sales operation not found");
        if (salesOperation.tickets.Count == 0)
        {
            throw new Exception("Tuua sales operation has no tickets");
        }

        return salesOperation;
    }

    // Con ticketId solo se genera ese ticket; sin él, todos los de la venta.
    public async Task<byte[]> Generate(Guid salesOperationId, Guid? ticketId = null)
    {
        var salesOperation = await GetSalesOperation(salesOperationId);
        if (ticketId is not null)
        {
            salesOperation.tickets = salesOperation.tickets.Where(t => t.id == ticketId).ToList();
            if (salesOperation.tickets.Count == 0)
            {
                throw new Exception("Tuua ticket not found in the sales operation");
            }
        }

        return await Generate(salesOperation);
    }

    public async Task<byte[]> Generate(TuuaSalesOperation salesOperation)
    {
        var flight = salesOperation.flight_id is null ? null : await _flightDao.GetById(salesOperation.flight_id.Value);
        var session = await _cashierMachineSessionDao.GetById(salesOperation.cashier_machine_session_id);
        var cashierMachine = session is null ? null : await _cashierMachineDao.GetByCode(session.cashier_machine_code);
        var terminal = cashierMachine?.terminal_id is null ? null : await _terminalDao.GetById(cashierMachine.terminal_id.Value);
        var airport = terminal?.airport_id is null ? null : await _airportDao.GetById(terminal.airport_id.Value);

        var accounting = await _featureDao.GetActiveByFeatureGroupName(AccountingParametersGroupName);
        var companyName = accounting.FirstOrDefault(p => p.description?.Trim().ToLower() == "razón social")?.feature_value;
        var companyRuc = accounting.FirstOrDefault(p => p.description?.Trim().ToLower() == "ruc")?.feature_value;

        var currency = await _featureDao.GetFeatureById(salesOperation.currency_id);
        var documentType = await _featureDao.GetFeatureById(salesOperation.document_type_id);
        var paymentType = await _featureDao.GetFeatureById(salesOperation.payment_type_id);
        var flightType = salesOperation.flight_type_id is null
            ? null
            : await _featureDao.GetFeatureById(salesOperation.flight_type_id.Value);

        var document = new Document();
        document.Info.Title = "Tickets TUUA";
        DefineStyles(document);
        var qrPlaceholders = new List<Paragraph>();

        foreach (var ticket in salesOperation.tickets)
        {
            var section = document.AddSection();
            section.PageSetup.PageWidth = Unit.FromMillimeter(80);
            section.PageSetup.PageHeight = Unit.FromMillimeter(190);
            section.PageSetup.LeftMargin = Unit.FromMillimeter(5);
            section.PageSetup.RightMargin = Unit.FromMillimeter(5);
            section.PageSetup.TopMargin = Unit.FromMillimeter(6);
            section.PageSetup.BottomMargin = Unit.FromMillimeter(6);

            AddCentered(section, companyName ?? string.Empty, "Title");
            AddCentered(section, $"RUC {companyRuc}", "Normal");
            AddCentered(section, airport?.name ?? string.Empty, "Normal");
            AddSeparator(section);

            AddCentered(section, "TICKET TUUA", "Title");
            AddCentered(section, documentType?.description ?? string.Empty, "Normal");
            AddCentered(section, $"{ticket.serial}-{ticket.sequential_number:D8}", "Title");
            AddSeparator(section);

            AddLine(section, "Fecha emisión", salesOperation.operation_date.ToString("dd/MM/yyyy HH:mm"));
            AddLine(section, "Terminal", terminal?.name);
            AddLine(section, "Caja", session?.cashier_machine_code);
            AddLine(section, "Pasajero", salesOperation.titular_passenger_name);
            AddLine(section, "Vuelo", salesOperation.flight_number);
            AddLine(section, "Fecha vuelo", salesOperation.flight_date?.ToString("dd/MM/yyyy"));
            if (flight is not null)
            {
                AddLine(section, "Ruta", $"{flight.origin_airport_code} - {flight.destination_airprt_code}");
            }
            AddLine(section, "Tipo vuelo", flightType?.description);
            AddLine(section, "Forma de pago", paymentType?.description);
            AddSeparator(section);

            var currencyCode = currency?.feature_value ?? string.Empty;
            AddLine(section, "Op. gravada", FormatAmount(currencyCode, ticket.subtotal));
            AddLine(section, "IGV", FormatAmount(currencyCode, ticket.igv_tax_amount));
            AddLine(section, "TOTAL", FormatAmount(currencyCode, ticket.total), "Strong");
            AddSeparator(section);

            // El QR se dibuja como vectores después del render (no se usa una imagen: la versión Core
            // de PDFsharp/MigraDoc no incluye importador de PNG). Este párrafo solo reserva el espacio.
            var qr = section.AddParagraph(" ");
            qr.Format.LineSpacingRule = LineSpacingRule.Exactly;
            qr.Format.LineSpacing = Unit.FromMillimeter(QrSizeMm);
            qr.Format.SpaceBefore = Unit.FromPoint(2);
            qr.Format.SpaceAfter = Unit.FromPoint(4);
            qrPlaceholders.Add(qr);

            AddCentered(section, ticket.hash_ticket, "Strong");
            AddCentered(section, "Presente este ticket en la puerta de embarque.", "Small");
        }

        var renderer = new PdfDocumentRenderer { Document = document };
        renderer.RenderDocument();

        for (var i = 0; i < salesOperation.tickets.Count; i++)
        {
            DrawQr(renderer, i + 1, qrPlaceholders[i], salesOperation.tickets[i].hash_ticket);
        }

        using var stream = new MemoryStream();
        renderer.PdfDocument.Save(stream, false);
        return stream.ToArray();
    }

    // Envía el PDF de los tickets al correo indicado o, si no se indica, al correo del pasajero.
    public async Task<string> SendByEmail(Guid salesOperationId, string? email, EmailBL emailBl)
    {
        var salesOperation = await GetSalesOperation(salesOperationId);
        var to = string.IsNullOrWhiteSpace(email) ? salesOperation.passenger_email : email.Trim();
        if (string.IsNullOrWhiteSpace(to))
        {
            throw new Exception("No email address to send the tickets to");
        }

        var pdf = await Generate(salesOperation);
        var tickets = string.Join("", salesOperation.tickets.Select(t =>
            $"<li>{t.serial}-{t.sequential_number:D8} ({t.hash_ticket})</li>"));
        var body = $"<p>Estimado(a) {salesOperation.titular_passenger_name}:</p>" +
                   $"<p>Adjuntamos sus tickets TUUA para el vuelo {salesOperation.flight_number} " +
                   $"del {salesOperation.flight_date:dd/MM/yyyy}.</p><ul>{tickets}</ul>" +
                   "<p>Presente el ticket en la puerta de embarque.</p>";

        await emailBl.Send(to, $"Tickets TUUA - Vuelo {salesOperation.flight_number}", body,
            $"tickets-tuua-{salesOperationId}.pdf", pdf);
        return to;
    }

    private static void DefineStyles(Document document)
    {
        var normal = document.Styles["Normal"]!;
        normal.Font.Name = "Arial";
        normal.Font.Size = 8;
        normal.ParagraphFormat.SpaceAfter = Unit.FromPoint(1);

        var title = document.Styles.AddStyle("Title", "Normal");
        title.Font.Size = 10;
        title.Font.Bold = true;

        var strong = document.Styles.AddStyle("Strong", "Normal");
        strong.Font.Bold = true;

        var small = document.Styles.AddStyle("Small", "Normal");
        small.Font.Size = 7;
    }

    private static void AddCentered(Section section, string text, string style)
    {
        var paragraph = section.AddParagraph(text, style);
        paragraph.Format.Alignment = ParagraphAlignment.Center;
    }

    private static void AddLine(Section section, string label, string? value, string style = "Normal")
    {
        var paragraph = section.AddParagraph(string.Empty, style);
        paragraph.Format.TabStops.AddTabStop(Unit.FromMillimeter(70), TabAlignment.Right);
        paragraph.AddText(label);
        paragraph.AddTab();
        paragraph.AddText(value ?? string.Empty);
    }

    private static void AddSeparator(Section section)
    {
        var paragraph = section.AddParagraph();
        paragraph.Format.Borders.Bottom.Width = Unit.FromPoint(0.5);
        paragraph.Format.SpaceAfter = Unit.FromPoint(4);
    }

    private static string FormatAmount(string currencyCode, decimal amount)
    {
        return $"{currencyCode} {amount.ToString("N2", CultureInfo.InvariantCulture)}";
    }

    // Dibuja el QR centrado sobre el espacio reservado por el párrafo, un cuadrado por módulo.
    private static void DrawQr(PdfDocumentRenderer renderer, int pageNumber, Paragraph placeholder, string content)
    {
        var info = renderer.DocumentRenderer.GetRenderInfoFromPage(pageNumber)
            .FirstOrDefault(r => ReferenceEquals(r.DocumentObject, placeholder))
            ?? throw new Exception("QR placeholder not found in the rendered ticket page");
        var area = info.LayoutInfo.ContentArea;

        using var generator = new QRCodeGenerator();
        using var data = generator.CreateQrCode(content, QRCodeGenerator.ECCLevel.M);
        var modules = data.ModuleMatrix; // incluye la zona de silencio (4 módulos por lado)

        var size = XUnit.FromMillimeter(QrSizeMm).Point;
        var cell = size / modules.Count;
        var left = area.X.Point + (area.Width.Point - size) / 2;
        var top = area.Y.Point + (area.Height.Point - size) / 2;

        using var graphics = XGraphics.FromPdfPage(renderer.PdfDocument.Pages[pageNumber - 1]);
        for (var row = 0; row < modules.Count; row++)
        {
            for (var col = 0; col < modules.Count; col++)
            {
                if (modules[row][col])
                {
                    // un pequeño solape evita líneas blancas entre módulos al ampliar
                    graphics.DrawRectangle(XBrushes.Black, left + col * cell, top + row * cell, cell + 0.15, cell + 0.15);
                }
            }
        }
    }
}
