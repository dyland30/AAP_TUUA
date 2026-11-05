namespace AAP_TUUA.Entidades;

public class LocalUserCashierMachine
{
    public Guid local_user_id { get; set; }
    public string cashier_machine_code { get; set; } = string.Empty;
    public DateTime? created_at { get; set; }
    public DateTime? updated_at { get; set; }
    public string? created_by { get; set; }
    public string? modified_by { get; set; }
}
