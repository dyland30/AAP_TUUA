namespace AAP_TUUA.Entidades;

public class VideoWall
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
    public Guid? airport_sector_id
    {
        get; set;
    }
    public string code { get; set; } = string.Empty;
    public string name { get; set; } = string.Empty;
    public short grid_rows
    {
        get; set;
    }
    public short grid_columns
    {
        get; set;
    }
    public Guid? behavior_group_id
    {
        get; set;
    }
    public bool is_active { get; set; } = true;
}
