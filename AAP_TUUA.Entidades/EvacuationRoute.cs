namespace AAP_TUUA.Entidades;

public class EvacuationRoute
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
    public Guid airport_sector_id
    {
        get; set;
    }
    public string code { get; set; } = string.Empty;
    public string name_es { get; set; } = string.Empty;
    public string? name_en
    {
        get; set;
    }
    public string? direction_icon
    {
        get; set;
    }
    public string? exit_name
    {
        get; set;
    }
    public bool is_default
    {
        get; set;
    }
    public bool is_active { get; set; } = true;
}
