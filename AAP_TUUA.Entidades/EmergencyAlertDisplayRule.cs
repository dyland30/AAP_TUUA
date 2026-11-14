namespace AAP_TUUA.Entidades;

public class EmergencyAlertDisplayRule
{
    public Guid? id
    {
        get; set;
    }
    public DateTime? created_at
    {
        get; set;
    }
    public DateTime? updated_at
    {
        get; set;
    }
    public string? created_by
    {
        get; set;
    }
    public string? modified_by
    {
        get; set;
    }
    public int alert_type_id
    {
        get; set;
    }
    public int display_type_id
    {
        get; set;
    }
    public bool is_active { get; set; } = true;
}
