namespace AAP_TUUA.Entidades;

public class EmergencyAlert
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
    public int alert_type_id
    {
        get; set;
    }
    public int origin_id
    {
        get; set;
    }
    public int coverage_id
    {
        get; set;
    }
    public int status_id
    {
        get; set;
    }
    public Guid? integration_message_id
    {
        get; set;
    }
    public string? custom_message_es
    {
        get; set;
    }
    public string? custom_message_en
    {
        get; set;
    }
    public DateTime requested_at { get; set; } = DateTime.UtcNow;
    public string? requested_by
    {
        get; set;
    }
    public DateTime? confirmed_at
    {
        get; set;
    }
    public string? confirmed_by
    {
        get; set;
    }
    public DateTime? started_at
    {
        get; set;
    }
    public DateTime? ended_at
    {
        get; set;
    }
    public string? ended_by
    {
        get; set;
    }
    public int? deploy_duration_ms
    {
        get; set;
    }
    public int? restore_duration_ms
    {
        get; set;
    }
    public bool pa_triggered
    {
        get; set;
    }
    public string? observation
    {
        get; set;
    }
}
