using PdfSharp.Fonts;

namespace AAP_TUUA.Business.Util;

// Resuelve las fuentes de PDFsharp desde las carpetas de fuentes del sistema operativo.
// Todas las familias se mapean a una fuente sans-serif disponible (Arial en Windows,
// Liberation Sans o DejaVu Sans en Linux; en Docker instalar fonts-liberation o fonts-dejavu-core).
public class SystemFontResolver : IFontResolver
{
    private const string Regular = "TuuaSans";
    private const string Bold = "TuuaSans-Bold";

    private static readonly string[] RegularCandidates =
    [
        @"C:\Windows\Fonts\arial.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/liberation-sans/LiberationSans-Regular.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/dejavu/DejaVuSans.ttf"
    ];

    private static readonly string[] BoldCandidates =
    [
        @"C:\Windows\Fonts\arialbd.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/liberation-sans/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf"
    ];

    private static readonly object Lock = new();
    private static bool _registered;

    public static void Register()
    {
        lock (Lock)
        {
            if (_registered)
            {
                return;
            }

            GlobalFontSettings.FontResolver = new SystemFontResolver();
            _registered = true;
        }
    }

    public FontResolverInfo ResolveTypeface(string familyName, bool isBold, bool isItalic)
    {
        return new FontResolverInfo(isBold ? Bold : Regular);
    }

    public byte[] GetFont(string faceName)
    {
        var candidates = faceName == Bold ? BoldCandidates : RegularCandidates;
        var path = candidates.FirstOrDefault(File.Exists)
                   ?? throw new Exception("No system font found to generate the PDF (install fonts-liberation)");
        return File.ReadAllBytes(path);
    }
}
