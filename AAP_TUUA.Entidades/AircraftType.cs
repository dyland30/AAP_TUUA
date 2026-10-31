namespace AAP_TUUA.Entidades;

public class AircraftType
{
    public Guid? id { get; set; }
    public string icao_code { get; set; } = string.Empty;
    public string? iata_code { get; set; }
    public int manufacturer_id { get; set; } //de Features con Feature Group Name: Fabricante - Aircraft
    public string model { get; set; } = string.Empty;
    public int size_code_id { get; set; } //de Features con Feature Group Name: Aircraft Size Codes
    public decimal? wingspan_m { get; set; }
    public decimal? length_m { get; set; }
    public int? max_seats { get; set; }
    public bool is_widebody { get; set; }
    public bool is_active { get; set; } = true;
    public DateTime? created_at { get; set; }
    public DateTime? updated_at { get; set; }
    public string? created_by { get; set; }
    public string? modified_by { get; set; }
}
