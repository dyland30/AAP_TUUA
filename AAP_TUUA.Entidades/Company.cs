namespace AAP_TUUA.Entidades;

public class Company
{
    public Guid? id { get; set; }
    public string? company_name { get; set; }
    public string? business_name { get; set; }
    public string? document_number { get; set; }
    public string? address { get; set; }
    public bool is_active { get; set; } = true;
    public DateTime? created_at { get; set; }
    public DateTime? updated_at { get; set; }
    public string? created_by { get; set; }
    public string? modified_by { get; set; }
}
