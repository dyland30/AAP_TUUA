namespace AAP_TUUA.Entidades;

public class BehaviorGroupRule
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
    public int rule_type_id
    {
        get; set;
    }
    public int? field_id
    {
        get; set;
    }
    public int? operator_id
    {
        get; set;
    }
    public string? rule_value
    {
        get; set;
    }
    public int[]? status_filter_ids
    {
        get; set;
    }
    public int? show_from_offset_min
    {
        get; set;
    }
    public int? show_until_offset_min
    {
        get; set;
    }
    public short? duration_seconds
    {
        get; set;
    }
    public short priority { get; set; } = 100;
    public short sort_order
    {
        get; set;
    }
    public Guid? airport_sector_id
    {
        get; set;
    }
    public bool is_active { get; set; } = true;
}
