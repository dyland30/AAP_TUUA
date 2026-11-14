namespace AAP_TUUA.Entidades;

public class AdCampaignBehaviorGroup
{
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
    public Guid behavior_group_id
    {
        get; set;
    }
}
