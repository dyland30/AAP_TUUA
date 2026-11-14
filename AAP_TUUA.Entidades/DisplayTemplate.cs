namespace AAP_TUUA.Entidades;

public class DisplayTemplate
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
    public string code { get; set; } = string.Empty;
    public string name { get; set; } = string.Empty;
    public string? description
    {
        get; set;
    }
    public int display_type_id
    {
        get; set;
    }
    public int orientation_id
    {
        get; set;
    }
    public int resolution_id
    {
        get; set;
    }
    public short? flight_slots
    {
        get; set;
    }
    public Guid? current_version_id
    {
        get; set;
    }
    public bool is_virtual_keypad
    {
        get; set;
    }
    public bool is_active { get; set; } = true;
}
