using System.Globalization;

namespace AAP_TUUA.Business.BPParser;


/// <summary>Opciones del parser.</summary>
public sealed class BcbpParserOptions
{
    /// <summary>
    /// Fecha de referencia para inferir años (normalmente "hoy" en la zona del aeropuerto).
    /// Si es null se usa la fecha UTC actual.
    /// </summary>
    public DateOnly? ReferenceDate { get; init; }

    /// <summary>
    /// Días de tolerancia por diferencias de zona horaria: la emisión puede caer hasta N días
    /// después de la referencia, y un vuelo hasta N días antes de la emisión o del tramo anterior.
    /// </summary>
    public int ToleranceDays { get; init; } = 1;

    /// <summary>Si es true, cualquier advertencia se convierte en <see cref="BcbpFormatException"/>.</summary>
    public bool Strict { get; init; }

    /// <summary>Quita el identificador AIM de simbología (]L2, ]Q1, ]z0, ]d1…) que agregan algunos lectores.</summary>
    public bool StripAimSymbologyIdentifier { get; init; } = true;
}

/// <summary>Error de formato con la posición (base 0) dentro de la cadena donde ocurrió.</summary>
public sealed class BcbpFormatException : FormatException
{
    public int Position { get; }

    public BcbpFormatException(string message, int position)
        : base(position >= 0 ? $"{message} (posición {position})" : message)
    {
        Position = position;
    }
}

/// <summary>
/// Resolución de fechas julianas BCBP. El estándar solo codifica el día del año (y, en la
/// fecha de emisión, el último dígito del año), así que el año completo hay que inferirlo.
/// </summary>
public static class JulianDateResolver
{
    public static bool IsValidDayOfYear(int year, int dayOfYear) =>
        dayOfYear >= 1 && dayOfYear <= (DateTime.IsLeapYear(year) ? 366 : 365);

    public static DateOnly FromDayOfYear(int year, int dayOfYear) =>
        new DateOnly(year, 1, 1).AddDays(dayOfYear - 1);

    /// <summary>Fecha con ese día del año más cercana a la referencia (año anterior, actual o siguiente).</summary>
    public static DateOnly? ResolveNearest(int dayOfYear, DateOnly reference)
    {
        DateOnly? best = null;
        var bestDistance = int.MaxValue;
        for (var year = reference.Year - 1; year <= reference.Year + 1; year++)
        {
            if (!IsValidDayOfYear(year, dayOfYear)) continue;
            var candidate = FromDayOfYear(year, dayOfYear);
            var distance = Math.Abs(candidate.DayNumber - reference.DayNumber);
            if (distance < bestDistance)
            {
                best = candidate;
                bestDistance = distance;
            }
        }
        return best;
    }

    /// <summary>Primera fecha con ese día del año que sea igual o posterior a <paramref name="notBefore"/>.</summary>
    public static DateOnly? ResolveOnOrAfter(int dayOfYear, DateOnly notBefore)
    {
        // Hasta 4 años hacia adelante para cubrir el día 366 (solo existe en bisiestos).
        for (var year = notBefore.Year; year <= notBefore.Year + 4; year++)
        {
            if (!IsValidDayOfYear(year, dayOfYear)) continue;
            var candidate = FromDayOfYear(year, dayOfYear);
            if (candidate >= notBefore) return candidate;
        }
        return null;
    }

    /// <summary>
    /// Fecha de emisión (formato YDDD): el año más reciente terminado en <paramref name="yearLastDigit"/>
    /// cuya fecha no sea posterior a <paramref name="notAfter"/>.
    /// </summary>
    public static DateOnly? ResolveWithYearDigit(int yearLastDigit, int dayOfYear, DateOnly notAfter)
    {
        for (var year = notAfter.Year; year >= notAfter.Year - 20; year--)
        {
            if (year % 10 != yearLastDigit || !IsValidDayOfYear(year, dayOfYear)) continue;
            var candidate = FromDayOfYear(year, dayOfYear);
            if (candidate <= notAfter) return candidate;
        }
        return null;
    }
}

/// <summary>Lector secuencial de campos de longitud fija sobre una porción de la cadena.</summary>
internal sealed class FieldReader
{
    private readonly string _source;
    private readonly int _end;

    public FieldReader(string source, int start, int length)
    {
        _source = source;
        Position = start;
        _end = start + length;
    }

    public int Position { get; private set; }
    public int Remaining => _end - Position;
    public bool IsAtEnd => Position >= _end;
    public char Peek() => Remaining > 0 ? _source[Position] : '\0';

    public string Read(int length, string field)
    {
        if (Remaining < length)
            throw new BcbpFormatException(
                $"El campo '{field}' requiere {length} caracteres pero solo quedan {Remaining}.", Position);
        var value = _source.Substring(Position, length);
        Position += length;
        return value;
    }

    /// <summary>Lee un campo condicional: null si la sección terminó, parcial (con advertencia) si está truncado.</summary>
    public string? ReadOptional(int length, string field, ICollection<string> warnings)
    {
        if (Remaining <= 0) return null;
        if (Remaining < length)
        {
            warnings.Add($"El campo '{field}' está truncado: se esperaban {length} caracteres y hay {Remaining} (posición {Position}).");
            length = Remaining;
        }
        return Read(length, field);
    }

    public int ReadHexSize(string field)
    {
        var position = Position;
        var text = Read(2, field);
        if (!TryParseHex(text, out var value))
            throw new BcbpFormatException($"El campo '{field}' debe ser hexadecimal de 2 dígitos y vale '{text}'.", position);
        return value;
    }

    /// <summary>Intenta leer un tamaño hexadecimal; si no es válido no avanza.</summary>
    public bool TryReadHexSize(out int value)
    {
        value = 0;
        if (Remaining < 2 || !TryParseHex(_source.Substring(Position, 2), out value)) return false;
        Position += 2;
        return true;
    }

    /// <summary>Devuelve un lector acotado a los próximos <paramref name="length"/> caracteres y avanza.</summary>
    public FieldReader Slice(int length, string section)
    {
        if (length > Remaining)
            throw new BcbpFormatException(
                $"La sección '{section}' declara {length} caracteres pero solo quedan {Remaining}.", Position);
        var slice = new FieldReader(_source, Position, length);
        Position += length;
        return slice;
    }

    public string ReadRest()
    {
        var value = _source.Substring(Position, Remaining);
        Position = _end;
        return value;
    }

    private static bool TryParseHex(string text, out int value) =>
        int.TryParse(text, NumberStyles.AllowHexSpecifier, CultureInfo.InvariantCulture, out value);
}
