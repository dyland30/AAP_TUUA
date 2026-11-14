namespace AAP_TUUA.Entidades;

public class AirportSector
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
    public Guid? terminal_id
    {
        get; set;
    }
    public Guid? parent_id
    {
        get; set;
    }
    public string code { get; set; } = string.Empty;
    public string name { get; set; } = string.Empty;
    public string? level
    {
        get; set;
    }
    public string? description
    {
        get; set;
    }
    public bool is_active { get; set; } = true;
}
