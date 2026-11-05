namespace AAP_TUUA.Entidades;

public class CashierMachineSession
{
    public Guid? id { get; set; }
    public string cashier_machine_code { get; set; } = string.Empty;
    public Guid local_user_id { get; set; }
    public DateTime start_time { get; set; }
    public DateTime? end_time { get; set; }
    public int status_id { get; set; }
    public bool is_active { get; set; } = true;
    public DateTime? created_at { get; set; }
    public DateTime? updated_at { get; set; }
    public string? created_by { get; set; }
    public string? modified_by { get; set; }
}
