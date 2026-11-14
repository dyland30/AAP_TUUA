namespace AAP_TUUA.Entidades;

public class DisplayTemplateField
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
    public int field_id
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
    public short? font_size
    {
        get; set;
    }
    public string? text_align
    {
        get; set;
    }
    public string? format_mask
    {
        get; set;
    }
    public bool is_bilingual { get; set; } = true;
    public bool is_visible { get; set; } = true;
    public short sort_order
    {
        get; set;
    }
    public string? properties
    {
        get; set;
    }
}
