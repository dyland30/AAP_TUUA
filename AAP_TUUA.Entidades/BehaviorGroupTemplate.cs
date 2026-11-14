namespace AAP_TUUA.Entidades;

public class BehaviorGroupTemplate
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
    public Guid behavior_group_id
    {
        get; set;
    }
    public Guid display_template_id
    {
        get; set;
    }
    public int? orientation_id
    {
        get; set;
    }
    public int? resolution_id
    {
        get; set;
    }
    public short? flight_slots
    {
        get; set;
    }
    public bool is_default
    {
        get; set;
    }
    public bool is_active { get; set; } = true;
}
