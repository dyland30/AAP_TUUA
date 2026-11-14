namespace AAP_TUUA.Entidades;

public class DeviceIncident
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
    public Guid device_id
    {
        get; set;
    }
    public int incident_type_id
    {
        get; set;
    }
    public DateTime detected_at
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
    public DateTime? resolved_at
    {
        get; set;
    }
    public string? resolved_by
    {
        get; set;
    }
    public int error_count { get; set; } = 1;
    public bool is_escalated
    {
        get; set;
    }
    public DateTime? escalated_at
    {
        get; set;
    }
    public long? system_event_log_id
    {
        get; set;
    }
    public string? notes
    {
        get; set;
    }
    public bool is_active { get; set; } = true;
}
