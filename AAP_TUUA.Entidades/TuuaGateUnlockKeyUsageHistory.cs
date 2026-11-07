namespace AAP_TUUA.Entidades;

public class TuuaGateUnlockKeyUsageHistory
{
    public Guid? id { get; set; }
    public Guid? tuua_gate_unlock_keys_id { get; set; }
    public DateTime usage_date { get; set; }
    public string tuua_gate_code { get; set; } = string.Empty;
    public DateTime? created_at { get; set; }
    public DateTime? updated_at { get; set; }
    public string? created_by { get; set; }
    public string? modified_by { get; set; }
}
