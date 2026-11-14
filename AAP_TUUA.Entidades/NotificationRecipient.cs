namespace AAP_TUUA.Entidades;

public class NotificationRecipient
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
    public int event_type_id
    {
        get; set;
    }
    public int channel_id
    {
        get; set;
    }
    public Guid? local_user_id
    {
        get; set;
    }
    public string recipient_address { get; set; } = string.Empty;
    public int? min_level_id
    {
        get; set;
    }
    public bool is_active { get; set; } = true;
}
