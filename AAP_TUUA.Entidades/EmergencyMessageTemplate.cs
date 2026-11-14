namespace AAP_TUUA.Entidades;

public class EmergencyMessageTemplate
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
    public int alert_type_id
    {
        get; set;
    }
    public int language_id
    {
        get; set;
    }
    public string title { get; set; } = string.Empty;
    public string? subtitle
    {
        get; set;
    }
    public string? instructions
    {
        get; set;
    }
    public string? ticker_text
    {
        get; set;
    }
    public Guid? icon_media_asset_id
    {
        get; set;
    }
    public Guid? display_template_id
    {
        get; set;
    }
    public bool is_active { get; set; } = true;
}
