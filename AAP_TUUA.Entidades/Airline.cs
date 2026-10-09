namespace AAP_TUUA.Entidades;

public class Airline
{
    public Guid? id { get; set; }
    public string? company_name { get; set; }
    public string? ruc { get; set; }
    public string? cod_sap { get; set; }
    public string? oaci_code { get; set; }
    public string? iata_code { get; set; }
    public bool is_active { get; set; }
    public DateTime? created_at { get; set; }
    public DateTime? updated_at { get; set; }
    public string? created_by { get; set; }
    public string? modified_by { get; set; }
}
