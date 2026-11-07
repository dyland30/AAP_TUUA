namespace AAP_TUUA.Entidades;

// Filtros del reporte de uso de llaves de destrabe. El rango de fechas incluye ambos días y se aplica sobre
// usage_date. El usuario es el dueño de la llave de destrabe utilizada.
public class TuuaGateUnlockKeyUsageFilter
{
    public DateTime? date_from { get; set; }
    public DateTime? date_to { get; set; }
    public Guid? airport_id { get; set; }
    public Guid? terminal_id { get; set; }
    public string? tuua_gate_code { get; set; }
    public Guid? user_id { get; set; }
    public int page { get; set; } = 1;
    public int page_size { get; set; } = 20;
}

// Uso de llave de destrabe con la puerta TUUA, su terminal y aeropuerto, y el usuario que lo registró.
public class TuuaGateUnlockKeyUsageReportItem : TuuaGateUnlockKeyUsageHistory
{
    public string? tuua_gate_description { get; set; }
    public Guid? terminal_id { get; set; }
    public string? terminal_name { get; set; }
    public Guid? airport_id { get; set; }
    public string? airport_name { get; set; }
    public string? airport_iata_code { get; set; }
    public string? key_code { get; set; }
    public string? key_type_description { get; set; }
    public Guid? user_id { get; set; }
    public string? user_name { get; set; }
    public string? user_email { get; set; }
}
