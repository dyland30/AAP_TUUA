namespace AAP_TUUA.Entidades;

public class DocumentSerialGroup
{
    public Guid? id { get; set; }
    public int? document_type_id { get; set; }
    public int? seae_type_id { get; set; }
    public int? sale_type_id { get; set; }
    public Guid? location_id { get; set; }
    public Guid? terminal_id { get; set; }
    public string? serial_prefix { get; set; }
    public int? serial_start { get; set; }
    public string? serial_end { get; set; }
    public bool is_active { get; set; } = true;
    public DateTime? created_at { get; set; }
    public DateTime? updated_at { get; set; }
    public string? created_by { get; set; }
    public string? modified_by { get; set; }
}
