namespace AAP_TUUA.Entidades;

public class VirtualKeypadButton
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
    public Guid? airport_id
    {
        get; set;
    }
    public Guid? airline_id
    {
        get; set;
    }
    public int target_status_id
    {
        get; set;
    }
    public string label_es { get; set; } = string.Empty;
    public string? label_en
    {
        get; set;
    }
    public string? color
    {
        get; set;
    }
    public short sort_order
    {
        get; set;
    }
    public bool requires_confirmation
    {
        get; set;
    }
    public bool is_active { get; set; } = true;
}
