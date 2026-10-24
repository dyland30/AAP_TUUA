namespace AAP_TUUA.Entidades;

public class AirportResource
{
    public Guid? id { get; set; }
    public int resource_type_id { get; set; } //de Features con Feature Group Name: Tipos de Recursos
    public Guid terminal_id { get; set; }
    public int flight_type_id { get; set; } //de Features con Feature Group Name: Tipos de Vuelo
    public int status_id { get; set; } //de Features con Feature Group Name: Estado de Recursos
    public string code { get; set; } = string.Empty;
    public string? name { get; set; }
    public bool is_active { get; set; } = true;
    public DateTime? created_at { get; set; }
    public DateTime? updated_at { get; set; }
    public string? created_by { get; set; }
    public string? modified_by { get; set; }
}
