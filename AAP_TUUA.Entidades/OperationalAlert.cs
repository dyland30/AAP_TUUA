namespace AAP_TUUA.Entidades;

public class OperationalAlert
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
    public Guid airport_id
    {
        get; set;
    }
    public Guid flight_id
    {
        get; set;
    }
    public int alert_type_id
    {
        get; set;
    }
    public string? threshold_value
    {
        get; set;
    }
    public string? old_value
    {
        get; set;
    }
    public string? new_value
    {
        get; set;
    }
    public DateTime detected_at { get; set; } = DateTime.UtcNow;
    public string? notified_to
    {
        get; set;
    }
    public DateTime? acknowledged_at
    {
        get; set;
    }
    public string? acknowledged_by
    {
        get; set;
    }
    public DateTime? propagated_at
    {
        get; set;
    }
    public bool is_active { get; set; } = true;
}
