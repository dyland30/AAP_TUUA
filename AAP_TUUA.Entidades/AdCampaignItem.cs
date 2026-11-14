namespace AAP_TUUA.Entidades;

public class AdCampaignItem
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
    public Guid ad_campaign_id
    {
        get; set;
    }
    public Guid media_asset_id
    {
        get; set;
    }
    public short sort_order
    {
        get; set;
    }
    public short? duration_seconds
    {
        get; set;
    }
    public bool is_active { get; set; } = true;
}
