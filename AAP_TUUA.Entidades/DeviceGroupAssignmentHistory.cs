namespace AAP_TUUA.Entidades;

public class DeviceGroupAssignmentHistory
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
    public Guid? previous_behavior_group_id
    {
        get; set;
    }
    public Guid behavior_group_id
    {
        get; set;
    }
    public DateTime assigned_at { get; set; } = DateTime.UtcNow;
    public string? assigned_by
    {
        get; set;
    }
    public DateTime? applied_at
    {
        get; set;
    }
    public string? reason
    {
        get; set;
    }
}
