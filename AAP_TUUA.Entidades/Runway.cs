namespace AAP_TUUA.Entidades;

public class Runway
{
    public Guid? id { get; set; }
    public Guid airport_id { get; set; }
    public string designator { get; set; } = string.Empty;
    public int? length_m { get; set; }
    public int? width_m { get; set; }
    public string? surface { get; set; }
    public int status_id { get; set; } //de Features con Feature Group Name: Estado de Recursos
    public bool is_active { get; set; } = true;
    public DateTime? created_at { get; set; }
    public DateTime? updated_at { get; set; }
    public string? created_by { get; set; }
    public string? modified_by { get; set; }
}
