using System.Diagnostics.CodeAnalysis;
using System.Globalization;
using System.Text.RegularExpressions;
using AAP_TUUA.Entidades.BPParser;

namespace AAP_TUUA.Business.BPParser;


/// <summary>
/// Parser de boarding passes BCBP (IATA Resolución 792), con soporte de 1 a 4 tramos,
/// secciones condicionales de cualquier versión, datos de aerolínea y firma de seguridad.
/// </summary>
public static partial class BcbpParser
{
    /// <summary>Campos obligatorios únicos: Format Code, Legs, Name, E-ticket.</summary>
    public const int MandatoryUniqueLength = 1 + 1 + 20 + 1;

    /// <summary>Campos obligatorios repetidos por tramo, incluido el tamaño hex de la sección variable.</summary>
    public const int MandatoryRepeatedLength = 7 + 3 + 3 + 3 + 5 + 3 + 1 + 4 + 5 + 1 + 2;

    /// <summary>Longitud mínima de un BCBP válido (un tramo sin datos condicionales).</summary>
    public const int MinimumLength = MandatoryUniqueLength + MandatoryRepeatedLength; // 60

    public static BoardingPass Parse(string raw, BcbpParserOptions? options = null)
    {
        ArgumentNullException.ThrowIfNull(raw);
        options ??= new BcbpParserOptions();
        var warnings = new List<string>();

        var data = Normalize(raw, options);
        if (data.Length < MinimumLength)
            throw new BcbpFormatException(
                $"Longitud {data.Length}: un BCBP tiene como mínimo {MinimumLength} caracteres.", -1);

        var reader = new FieldReader(data, 0, data.Length);
        var pass = new BoardingPass { Raw = data };

        // ---- Obligatorios únicos ----
        pass.FormatCode = reader.Read(1, "Format Code")[0];
        if (pass.FormatCode != 'M')
            throw new BcbpFormatException($"Format Code '{pass.FormatCode}' no soportado; se esperaba 'M'.", 0);

        var legsChar = reader.Read(1, "Number of Legs Encoded")[0];
        if (legsChar is < '1' or > '4')
            throw new BcbpFormatException($"Number of Legs Encoded '{legsChar}' inválido; debe ser 1–4.", 1);
        pass.NumberOfLegsEncoded = legsChar - '0';

        var name = reader.Read(20, "Passenger Name").TrimEnd();
        pass.PassengerName = name;
        var slash = name.IndexOf('/');
        pass.Surname = slash >= 0 ? name[..slash] : name;
        pass.GivenName = slash >= 0 && slash < name.Length - 1 ? name[(slash + 1)..] : null;

        pass.ElectronicTicketIndicator = reader.Read(1, "Electronic Ticket Indicator")[0];

        // ---- Tramos ----
        var legs = new List<Leg>(pass.NumberOfLegsEncoded);
        for (var i = 0; i < pass.NumberOfLegsEncoded; i++)
        {
            var legNo = i + 1;
            var leg = ReadMandatoryLeg(reader, legNo, warnings);

            var conditionalSize = reader.ReadHexSize($"Field size of variable size field (tramo {legNo})");
            var conditional = reader.Slice(conditionalSize, $"datos condicionales del tramo {legNo}");

            // La sección única (versión + campos únicos) solo existe en el primer tramo.
            if (i == 0 && conditional.Peek() == '>')
                ReadUniqueConditional(conditional, pass, warnings);

            if (!conditional.IsAtEnd)
                ReadRepeatedConditional(conditional, leg, legNo, warnings);

            if (!conditional.IsAtEnd)
                leg.AirlineIndividualUse = conditional.ReadRest();

            legs.Add(leg);
        }
        pass.Legs = legs;

        // ---- Datos de seguridad ----
        if (!reader.IsAtEnd && reader.Peek() == '^')
            pass.Security = ReadSecurity(reader, warnings);

        if (!reader.IsAtEnd)
        {
            pass.TrailingData = reader.ReadRest();
            warnings.Add($"Hay {pass.TrailingData.Length} caracteres después del último tramo que no corresponden a ninguna sección.");
        }

        ResolveDates(pass, options, warnings);

        pass.Warnings = warnings;
        if (options.Strict && warnings.Count > 0)
            throw new BcbpFormatException("Modo estricto: " + string.Join(" | ", warnings), -1);

        return pass;
    }

    public static bool TryParse(
        string? raw,
        [NotNullWhen(true)] out BoardingPass? pass,
        out string? error,
        BcbpParserOptions? options = null)
    {
        pass = null;
        error = null;
        if (raw is null)
        {
            error = "La cadena es null.";
            return false;
        }
        try
        {
            pass = Parse(raw, options);
            return true;
        }
        catch (BcbpFormatException ex)
        {
            error = ex.Message;
            return false;
        }
    }

    // ------------------------------------------------------------------

    private static string Normalize(string raw, BcbpParserOptions options)
    {
        var data = raw.TrimEnd('\r', '\n', '\0');
        // Identificador AIM: ']' + letra de simbología + modificador (p. ej. "]L2" PDF417, "]Q1" QR, "]z0" Aztec).
        if (options.StripAimSymbologyIdentifier && data.Length >= 3 && data[0] == ']' && char.IsLetter(data[1]))
            data = data[3..];
        return data;
    }

    private static Leg ReadMandatoryLeg(FieldReader r, int legNo, List<string> warnings)
    {
        var leg = new Leg { Index = legNo };
        string F(string field) => $"{field} (tramo {legNo})";

        leg.OperatingCarrierPnrCode = r.Read(7, F("Operating carrier PNR Code")).TrimEnd();
        leg.FromCityAirportCode = r.Read(3, F("From City Airport Code")).TrimEnd();
        leg.ToCityAirportCode = r.Read(3, F("To City Airport Code")).TrimEnd();
        leg.OperatingCarrierDesignator = r.Read(3, F("Operating carrier Designator")).TrimEnd();

        leg.FlightNumberRaw = r.Read(5, F("Flight Number"));
        var flight = FlightNumberRegex().Match(leg.FlightNumberRaw.Trim());
        if (flight.Success)
        {
            leg.FlightNumber = int.Parse(flight.Groups[1].Value, CultureInfo.InvariantCulture);
            leg.FlightNumberSuffix = flight.Groups[2].Success ? flight.Groups[2].Value[0] : null;
        }
        else
        {
            warnings.Add($"Tramo {legNo}: número de vuelo '{leg.FlightNumberRaw}' no tiene el formato NNNN[a].");
        }

        var datePosition = r.Position;
        var julian = r.Read(3, F("Date of Flight (Julian Date)"));
        if (!int.TryParse(julian, NumberStyles.None, CultureInfo.InvariantCulture, out var dayOfYear)
            || dayOfYear is < 1 or > 366)
            throw new BcbpFormatException($"Tramo {legNo}: fecha juliana '{julian}' inválida (debe ser 001–366).", datePosition);
        leg.DateOfFlightJulian = dayOfYear;

        leg.CompartmentCode = r.Read(1, F("Compartment Code"))[0];

        leg.SeatNumberRaw = r.Read(4, F("Seat Number"));
        var seat = SeatRegex().Match(leg.SeatNumberRaw.Trim());
        leg.SeatNumber = seat.Success ? seat.Groups[1].Value + seat.Groups[2].Value : leg.SeatNumberRaw.Trim();

        leg.CheckInSequenceNumberRaw = r.Read(5, F("Check-In Sequence Number"));
        var sequenceText = leg.CheckInSequenceNumberRaw.Trim();
        var sequence = SequenceRegex().Match(sequenceText);
        if (sequence.Success)
        {
            leg.CheckInSequenceNumber = int.Parse(sequence.Groups[1].Value, CultureInfo.InvariantCulture);
            leg.CheckInSequenceSuffix = sequence.Groups[2].Success ? sequence.Groups[2].Value[0] : null;
        }
        else if (sequenceText.Length > 0)
        {
            warnings.Add($"Tramo {legNo}: número de secuencia '{leg.CheckInSequenceNumberRaw}' no tiene el formato NNNN[f].");
        }

        leg.PassengerStatus = r.Read(1, F("Passenger Status"))[0];
        return leg;
    }

    private static void ReadUniqueConditional(FieldReader c, BoardingPass pass, List<string> warnings)
    {
        c.Read(1, "Beginning of version number"); // '>'
        pass.VersionNumberRaw = c.Read(1, "Version Number")[0];

        var size = c.ReadHexSize("Field size of following structured message - unique");
        var u = c.Slice(size, "datos condicionales únicos");

        pass.PassengerDescription = Ch(u.ReadOptional(1, "Passenger Description", warnings));
        pass.SourceOfCheckIn = Ch(u.ReadOptional(1, "Source of check-in", warnings));
        pass.SourceOfBoardingPassIssuance = Ch(u.ReadOptional(1, "Source of Boarding Pass Issuance", warnings));
        pass.DateOfIssueRaw = Str(u.ReadOptional(4, "Date of Issue of Boarding Pass", warnings));
        pass.DocumentType = Ch(u.ReadOptional(1, "Document Type", warnings));
        pass.IssuerAirlineDesignator = Str(u.ReadOptional(3, "Airline Designator of boarding pass issuer", warnings));

        var tags = new List<string>(3);
        foreach (var field in new[] { "Baggage Tag License Plate Number(s)", "1st Non-Consecutive Baggage Tag", "2nd Non-Consecutive Baggage Tag" })
        {
            if (Str(u.ReadOptional(13, field, warnings)) is { } tag) tags.Add(tag);
        }
        pass.BaggageTagLicensePlates = tags;

        if (!u.IsAtEnd)
        {
            pass.UnrecognizedUniqueData = u.ReadRest();
            warnings.Add($"Sección única con {pass.UnrecognizedUniqueData.Length} caracteres no reconocidos (¿versión {pass.VersionNumberRaw} más nueva?).");
        }
    }

    private static void ReadRepeatedConditional(FieldReader c, Leg leg, int legNo, List<string> warnings)
    {
        if (!c.TryReadHexSize(out var size))
        {
            warnings.Add($"Tramo {legNo}: la sección condicional no empieza con un tamaño hexadecimal; se toma como datos de aerolínea.");
            return;
        }
        if (size > c.Remaining)
            throw new BcbpFormatException(
                $"Tramo {legNo}: la sección repetida declara {size} caracteres pero solo quedan {c.Remaining}.", c.Position);

        var r = c.Slice(size, $"datos condicionales repetidos del tramo {legNo}");
        string F(string field) => $"{field} (tramo {legNo})";

        leg.AirlineNumericCode = Str(r.ReadOptional(3, F("Airline Numeric Code"), warnings));
        leg.DocumentFormSerialNumber = Str(r.ReadOptional(10, F("Document Form/Serial Number"), warnings));
        leg.SelecteeIndicator = Ch(r.ReadOptional(1, F("Selectee indicator"), warnings));
        leg.InternationalDocumentationVerification = Ch(r.ReadOptional(1, F("International Documentation Verification"), warnings));
        leg.MarketingCarrierDesignator = Str(r.ReadOptional(3, F("Marketing carrier designator"), warnings));
        leg.FrequentFlyerAirlineDesignator = Str(r.ReadOptional(3, F("Frequent Flyer Airline Designator"), warnings));
        leg.FrequentFlyerNumber = Str(r.ReadOptional(16, F("Frequent Flyer Number"), warnings));
        leg.IdAdIndicator = Ch(r.ReadOptional(1, F("ID/AD Indicator"), warnings));
        leg.FreeBaggageAllowance = Str(r.ReadOptional(3, F("Free Baggage Allowance"), warnings));
        leg.FastTrack = Ch(r.ReadOptional(1, F("Fast Track"), warnings));

        if (!r.IsAtEnd)
        {
            leg.UnrecognizedRepeatedData = r.ReadRest();
            warnings.Add($"Tramo {legNo}: sección repetida con {leg.UnrecognizedRepeatedData.Length} caracteres no reconocidos.");
        }
    }

    private static SecurityData ReadSecurity(FieldReader r, List<string> warnings)
    {
        r.Read(1, "Beginning of Security Data"); // '^'
        var security = new SecurityData
        {
            Type = r.Read(1, "Type of Security Data")[0],
            DeclaredLength = r.ReadHexSize("Length of Security Data"),
        };
        security.Data = r.ReadOptional(security.DeclaredLength, "Security Data", warnings) ?? "";
        return security;
    }

    private static void ResolveDates(BoardingPass pass, BcbpParserOptions options, List<string> warnings)
    {
        var reference = options.ReferenceDate ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var tolerance = options.ToleranceDays;

        // 1) Fecha de emisión "YDDD": año más reciente terminado en Y que no sea futuro.
        if (pass.DateOfIssueRaw is { } issue)
        {
            if (issue.Length == 4 && issue.All(char.IsAsciiDigit)
                && int.Parse(issue.AsSpan(1), CultureInfo.InvariantCulture) is var issueDay and >= 1 and <= 366)
            {
                pass.DateOfIssue = JulianDateResolver.ResolveWithYearDigit(issue[0] - '0', issueDay, reference.AddDays(tolerance));
                if (pass.DateOfIssue is null)
                    warnings.Add($"No se pudo resolver la fecha de emisión '{issue}'.");
            }
            else
            {
                warnings.Add($"Fecha de emisión '{issue}' no tiene el formato YDDD.");
            }
        }

        // 2) Fechas de vuelo. El primer tramo se ancla en la emisión (el vuelo no puede ser anterior)
        //    o, si no hay emisión, en el año más cercano a la referencia. Los tramos siguientes se
        //    encadenan al anterior, lo que resuelve itinerarios que cruzan el fin de año.
        var anchor = pass.DateOfIssue;
        foreach (var leg in pass.Legs)
        {
            leg.DateOfFlight = anchor is { } a
                ? JulianDateResolver.ResolveOnOrAfter(leg.DateOfFlightJulian, a.AddDays(-tolerance))
                : JulianDateResolver.ResolveNearest(leg.DateOfFlightJulian, reference);

            if (leg.DateOfFlight is { } resolved)
                anchor = resolved;
            else
                warnings.Add($"Tramo {leg.Index}: no se pudo resolver el día juliano {leg.DateOfFlightJulian:000}.");
        }
    }

    private static char? Ch(string? value) => string.IsNullOrWhiteSpace(value) ? null : value[0];
    private static string? Str(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    [GeneratedRegex(@"^(\d{1,4})([A-Z])?$")]
    private static partial Regex FlightNumberRegex();

    [GeneratedRegex(@"^0*(\d{1,3})([A-Z])$")]
    private static partial Regex SeatRegex();

    [GeneratedRegex(@"^(\d{1,4})([A-Z])?$")]
    private static partial Regex SequenceRegex();
}
