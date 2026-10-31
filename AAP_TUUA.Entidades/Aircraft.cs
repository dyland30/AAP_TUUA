namespace AAP_TUUA.Entidades;

public class Aircraft
{
    public Guid? id { get; set; }
    public string registration { get; set; } = string.Empty;
    public Guid aircraft_type_id { get; set; }
    public Guid? operator_id { get; set; }
    public int? seat_count { get; set; }
    public bool is_active { get; set; } = true;
    public DateTime? created_at { get; set; }
    public DateTime? updated_at { get; set; }
    public string? created_by { get; set; }
    public string? modified_by { get; set; }
}
