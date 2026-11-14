namespace AAP_TUUA.Entidades;

public class DisplayTemplateVersion
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
    public Guid display_template_id
    {
        get; set;
    }
    public int version_number
    {
        get; set;
    }
    public string? layout
    {
        get; set;
    }
    public string? styles
    {
        get; set;
    }
    public Guid? background_media_asset_id
    {
        get; set;
    }
    public bool is_published
    {
        get; set;
    }
    public DateTime? published_at
    {
        get; set;
    }
    public string? published_by
    {
        get; set;
    }
    public string? change_notes
    {
        get; set;
    }
}
