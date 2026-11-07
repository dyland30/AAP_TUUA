using AAP_TUUA.Business.Util;
using AAP_TUUA.Dao;
using PdfSharp.Drawing;
using PdfSharp.Pdf;
using QRCoder;

namespace AAP_TUUA.Business;

// Genera el PDF de una llave de destrabe: una página con los datos de la llave y un QR con su código
// (el código en sí no se imprime).
public class TuuaGateUnlockKeyPdfBL
{
    private const double QrSizeMm = 60;

    private readonly TuuaGateUnlockKeyDao _unlockKeyDao;
    private readonly LocalUserDao _localUserDao;
    private readonly FeatureDao _featureDao;

    public TuuaGateUnlockKeyPdfBL(string cnx)
    {
        _unlockKeyDao = new TuuaGateUnlockKeyDao(cnx);
        _localUserDao = new LocalUserDao(cnx);
        _featureDao = new FeatureDao(cnx);
        SystemFontResolver.Register();
    }

    public async Task<byte[]> Generate(Guid unlockKeyId)
    {
        var key = await _unlockKeyDao.GetById(unlockKeyId) ?? throw new Exception("Unlock key not found");
        if (!key.is_active)
        {
            throw new Exception("Unlock key is not active");
        }

        if (string.IsNullOrWhiteSpace(key.code))
        {
            throw new Exception("Unlock key has no code");
        }

        var user = await _localUserDao.GetById(key.user_id);
        var type = await _featureDao.GetFeatureById(key.type_id);

        using var document = new PdfDocument();
        document.Info.Title = "Llave de destrabe";
        var page = document.AddPage();
        page.Width = XUnit.FromMillimeter(105);
        page.Height = XUnit.FromMillimeter(148);

        using var graphics = XGraphics.FromPdfPage(page);
        var title = new XFont("Arial", 16, XFontStyleEx.Bold);
        var strong = new XFont("Arial", 11, XFontStyleEx.Bold);
        var normal = new XFont("Arial", 10, XFontStyleEx.Regular);
        var small = new XFont("Arial", 8, XFontStyleEx.Regular);
        var width = page.Width.Point;

        DrawCentered(graphics, "LLAVE DE DESTRABE", title, 40, width);
        DrawCentered(graphics, type?.description ?? string.Empty, strong, 62, width);

        var qrSize = XUnit.FromMillimeter(QrSizeMm).Point;
        DrawQr(graphics, key.code, (width - qrSize) / 2, 80, qrSize);

        var y = 80 + qrSize + 22;
        DrawCentered(graphics, $"Usuario: {user?.name ?? user?.email ?? string.Empty}", normal, y, width);
        DrawCentered(graphics, $"Emitida: {key.created_at:dd/MM/yyyy HH:mm}", small, y + 16, width);

        using var stream = new MemoryStream();
        document.Save(stream, false);
        return stream.ToArray();
    }

    private static void DrawCentered(XGraphics graphics, string text, XFont font, double y, double pageWidth)
    {
        graphics.DrawString(text, font, XBrushes.Black, new XRect(0, y, pageWidth, font.Height),
            XStringFormats.TopCenter);
    }

    // Dibuja el QR como vectores, un cuadrado por módulo (igual que el de los tickets TUUA).
    private static void DrawQr(XGraphics graphics, string content, double left, double top, double size)
    {
        using var generator = new QRCodeGenerator();
        using var data = generator.CreateQrCode(content, QRCodeGenerator.ECCLevel.M);
        var modules = data.ModuleMatrix; // incluye la zona de silencio (4 módulos por lado)
        var cell = size / modules.Count;

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
