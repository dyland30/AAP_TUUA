namespace AAP_TUUA.Entidades;

public class CashierMachine
{
    public string? code { get; set; }
    public Guid? location_id { get; set; }
    public Guid? terminal_id { get; set; }
    public bool is_active { get; set; } = true;
    public DateTime? created_at { get; set; }
    public DateTime? updated_at { get; set; }
    public string? created_by { get; set; }
    public string? modified_by { get; set; }
}
