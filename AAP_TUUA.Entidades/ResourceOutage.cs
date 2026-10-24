namespace AAP_TUUA.Entidades;

public class ResourceOutage
{
    public Guid? id { get; set; }
    public Guid resource_id { get; set; }
    public DateTime? start_date { get; set; }
    public DateTime? end_date { get; set; }
    public string reason { get; set; } = string.Empty;
    public bool is_planned { get; set; } = true;
    public bool is_active { get; set; } = true;
    public DateTime? created_at { get; set; }
    public DateTime? updated_at { get; set; }
    public string? created_by { get; set; }
    public string? modified_by { get; set; }
}
