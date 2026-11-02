namespace AAP_TUUA.Entidades.BPParser;


/// <summary>
/// Boarding pass decodificado según IATA Resolución 792 (BCBP).
/// Los campos condicionales son null cuando no vienen en el código o están en blanco.
/// </summary>
public  class BoardingPass
{
    /// <summary>Cadena normalizada que se parseó (sin prefijo AIM ni CR/LF).</summary>
    public string Raw { get;  set; } = "";

    // ---- Obligatorios únicos ----
    public char FormatCode { get;  set; }
    public int NumberOfLegsEncoded { get;  set; }
    /// <summary>Nombre tal como viene (20 caracteres, sin el relleno final).</summary>
    public string PassengerName { get;  set; } = "";
    public string Surname { get;  set; } = "";
    public string? GivenName { get;  set; }
    public char ElectronicTicketIndicator { get;  set; }
    public bool IsElectronicTicket => ElectronicTicketIndicator == 'E';

    // ---- Condicionales únicos ----
    public char? VersionNumberRaw { get;  set; }
    public int? VersionNumber => VersionNumberRaw is >= '0' and <= '9' ? VersionNumberRaw - '0' : null;
    public char? PassengerDescription { get;  set; }
    public char? SourceOfCheckIn { get;  set; }
    public char? SourceOfBoardingPassIssuance { get;  set; }
    /// <summary>4 caracteres: último dígito del año + día juliano (ej. "6364").</summary>
    public string? DateOfIssueRaw { get;  set; }
    /// <summary>Fecha de emisión resuelta (año completo inferido).</summary>
    public DateOnly? DateOfIssue { get;  set; }
    public char? DocumentType { get;  set; }
    public string? IssuerAirlineDesignator { get;  set; }
    public IReadOnlyList<string> BaggageTagLicensePlates { get;  set; } = Array.Empty<string>();
    /// <summary>Datos únicos sobrantes no reconocidos (p. ej. campos de una versión más nueva).</summary>
    public string? UnrecognizedUniqueData { get;  set; }

    // ---- Tramos, seguridad y diagnóstico ----
    public IReadOnlyList<Leg> Legs { get;  set; } = Array.Empty<Leg>();
    public SecurityData? Security { get;  set; }
    public string? TrailingData { get;  set; }
    /// <summary>Anomalías no fatales detectadas al parsear (en modo Strict se convierten en error).</summary>
    public IReadOnlyList<string> Warnings { get;  set; } = Array.Empty<string>();
}

/// <summary>Un tramo (segmento) del boarding pass.</summary>
public  class Leg
{
    /// <summary>Posición del tramo en el código, empezando en 1.</summary>
    public int Index { get;  set; }

    // ---- Obligatorios repetidos ----
    public string OperatingCarrierPnrCode { get;  set; } = "";
    public string FromCityAirportCode { get;  set; } = "";
    public string ToCityAirportCode { get;  set; } = "";
    public string OperatingCarrierDesignator { get;  set; } = "";
    public string FlightNumberRaw { get;  set; } = "";
    public int? FlightNumber { get;  set; }
    public char? FlightNumberSuffix { get;  set; }
    /// <summary>Número de vuelo normalizado sin ceros a la izquierda (ej. "834", "1234A").</summary>
    public string FlightNumberNormalized => FlightNumber is { } n ? $"{n}{FlightNumberSuffix}" : FlightNumberRaw.Trim();
    /// <summary>Día del año (1–366) tal como viene en el código. No incluye año.</summary>
    public int DateOfFlightJulian { get;  set; }
    /// <summary>Fecha de vuelo con el año inferido. Null si no se pudo resolver.</summary>
    public DateOnly? DateOfFlight { get;  set; }
    public char CompartmentCode { get;  set; }
    public string SeatNumberRaw { get;  set; } = "";
    /// <summary>Asiento normalizado ("001A" → "1A"); valores especiales como "INF" se conservan.</summary>
    public string SeatNumber { get;  set; } = "";
    public string CheckInSequenceNumberRaw { get;  set; } = "";
    public int? CheckInSequenceNumber { get;  set; }
    public char? CheckInSequenceSuffix { get;  set; }
    public char PassengerStatus { get;  set; }

    // ---- Condicionales repetidos ----
    public string? AirlineNumericCode { get;  set; }
    public string? DocumentFormSerialNumber { get;  set; }
    /// <summary>Número de ticket de 13 dígitos (código numérico de aerolínea + serial), si ambos vienen.</summary>
    public string? TicketNumber => AirlineNumericCode is { } a && DocumentFormSerialNumber is { } s ? a + s : null;
    public char? SelecteeIndicator { get;  set; }
    public char? InternationalDocumentationVerification { get;  set; }
    public string? MarketingCarrierDesignator { get;  set; }
    public string? FrequentFlyerAirlineDesignator { get;  set; }
    public string? FrequentFlyerNumber { get;  set; }
    public char? IdAdIndicator { get;  set; }
    public string? FreeBaggageAllowance { get;  set; }
    public char? FastTrack { get;  set; }
    /// <summary>Datos repetidos sobrantes no reconocidos (p. ej. campos de una versión más nueva).</summary>
    public string? UnrecognizedRepeatedData { get;  set; }
    /// <summary>Datos libres "For individual airline use".</summary>
    public string? AirlineIndividualUse { get;  set; }

    /// <summary>
    /// Clave para detectar pases duplicados: aerolínea operadora, vuelo, fecha, origen y
    /// número de secuencia de check-in (o asiento si no hay secuencia).
    /// </summary>
    public string DeduplicationKey =>
        string.Join('|',
            OperatingCarrierDesignator,
            FlightNumberNormalized,
            DateOfFlight?.ToString("yyyyMMdd") ?? $"J{DateOfFlightJulian:000}",
            FromCityAirportCode,
            CheckInSequenceNumber?.ToString() ?? $"S{SeatNumber}");
}

/// <summary>Sección de seguridad (firma digital) que empieza con '^'.</summary>
public  class SecurityData
{
    public char Type { get;  set; }
    public int DeclaredLength { get;  set; }
    public string Data { get;  set; } = "";
}
