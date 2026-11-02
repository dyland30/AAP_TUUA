namespace AAP_TUUA.Entidades;

public class TuuaPayload
{
    public string? boardingString { get; set; } // Barcode string or tuua ticket code
    
    public DateOnly? operationDate { get; set; }

    public string? tuuaGateCode { get; set; }

    public string?  flightType { get; set; } // N --> Nacional, I --> Internacional
}