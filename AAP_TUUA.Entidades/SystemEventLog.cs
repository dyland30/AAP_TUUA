namespace AAP_TUUA.Entidades;

public class SystemEventLog
{
    public DateTime? created_at
    {
        get; set;
    }
    public string? created_by
    {
        get; set;
    }
    public long id
    {
        get; set;
    }
    public Guid? airport_id
    {
        get; set;
    }
    public int level_id
    {
        get; set;
    }
    public int component_id
    {
        get; set;
    }
    public int? event_type_id
    {
        get; set;
    }
    public string message { get; set; } = string.Empty;
    public string? details
    {
        get; set;
    }
    public Guid? device_id
    {
        get; set;
    }
    public Guid? integration_channel_id
    {
        get; set;
    }
    public Guid? emergency_alert_id
    {
        get; set;
    }
    public string? correlation_id
    {
        get; set;
    }
    public string? host_name
    {
        get; set;
    }
    public DateTime occurred_at { get; set; } = DateTime.UtcNow;
    public bool is_notified
    {
        get; set;
    }
}
