namespace AAP_TUUA.Entidades;

public class DocumentSequentialNumber
{
    public Guid? id { get; set; }
    public Guid? document_serial_group_id { get; set; }
    public string? cashier_code { get; set; }
    public int? serial_number { get; set; }
    public long? max_sequential_number { get; set; }
    public bool is_active { get; set; } = true;
    public DateTime? created_at { get; set; }
    public DateTime? updated_at { get; set; }
    public string? created_by { get; set; }
    public string? modified_by { get; set; }
}
