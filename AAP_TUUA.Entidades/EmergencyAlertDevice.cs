namespace AAP_TUUA.Entidades;

public class EmergencyAlertDevice
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
    public Guid emergency_alert_id
    {
        get; set;
    }
    public Guid device_id
    {
        get; set;
    }
    public Guid? previous_behavior_group_id
    {
        get; set;
    }
    public Guid? evacuation_route_id
    {
        get; set;
    }
    public int status_id
    {
        get; set;
    }
    public DateTime? sent_at
    {
        get; set;
    }
    public DateTime? displayed_at
    {
        get; set;
    }
    public DateTime? restored_at
    {
        get; set;
    }
    public string? error_message
    {
        get; set;
    }
}
