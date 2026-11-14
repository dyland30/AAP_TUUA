namespace AAP_TUUA.Entidades;

public class EmergencyAlertSector
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
    public Guid airport_sector_id
    {
        get; set;
    }
    public Guid? evacuation_route_id
    {
        get; set;
    }
}
