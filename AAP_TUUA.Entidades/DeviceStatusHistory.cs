namespace AAP_TUUA.Entidades;

public class DeviceStatusHistory
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
    public int status_id
    {
        get; set;
    }
    public DateTime started_at
    {
        get; set;
    }
    public DateTime? ended_at
    {
        get; set;
    }
    public int? duration_seconds
    {
        get; set;
    }
    public string? reason
    {
        get; set;
    }
}
