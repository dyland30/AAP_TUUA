namespace AAP_TUUA.Entidades;

public class DisplayTemplateWidget
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
    public Guid display_template_version_id
    {
        get; set;
    }
    public int widget_type_id
    {
        get; set;
    }
    public decimal pos_x
    {
        get; set;
    }
    public decimal pos_y
    {
        get; set;
    }
    public decimal width
    {
        get; set;
    }
    public decimal height
    {
        get; set;
    }
    public short z_index
    {
        get; set;
    }
    public string? config
    {
        get; set;
    }
    public bool is_visible { get; set; } = true;
}
