namespace AAP_TUUA.Entidades;

public class AdCampaign
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
    public Guid? company_id
    {
        get; set;
    }
    public string name { get; set; } = string.Empty;
    public string? description
    {
        get; set;
    }
    public DateTime start_date
    {
        get; set;
    }
    public DateTime end_date
    {
        get; set;
    }
    public TimeSpan? daily_start_time
    {
        get; set;
    }
    public TimeSpan? daily_end_time
    {
        get; set;
    }
    public short[]? days_of_week
    {
        get; set;
    }
    public int priority_id
    {
        get; set;
    }
    public int status_id
    {
        get; set;
    }
    public bool is_active { get; set; } = true;
}
