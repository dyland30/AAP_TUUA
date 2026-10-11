namespace AAP_TUUA.Entidades;

public class Airport
{
    public Guid? id { get; set; }
    public string? iata_code { get; set; }
    public string? oaci_code { get; set; }
    public string? name { get; set; }
    public string? city { get; set; }
    public string? region { get; set; }
    public string? country_code { get; set; }
    public string? ubigeo { get; set; }
    public decimal? latitude { get; set; }
    public decimal? longitude { get; set; }
    public int? elevation_m { get; set; }
    public int? elevation_f { get; set; }
    public string? timezone { get; set; }
    public string? airport_type { get; set; }
    public bool is_active { get; set; } = true;
    public DateTime? created_at { get; set; }
    public DateTime? updated_at { get; set; }
    public string? created_by { get; set; }
    public string? modified_by { get; set; }
}
