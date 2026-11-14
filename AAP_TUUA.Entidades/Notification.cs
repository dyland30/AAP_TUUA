namespace AAP_TUUA.Entidades;

public class Notification
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
    public long? system_event_log_id
    {
        get; set;
    }
    public Guid? notification_recipient_id
    {
        get; set;
    }
    public int channel_id
    {
        get; set;
    }
    public string recipient_address { get; set; } = string.Empty;
    public string? subject
    {
        get; set;
    }
    public string? body
    {
        get; set;
    }
    public int status_id
    {
        get; set;
    }
    public short attempts
    {
        get; set;
    }
    public DateTime? sent_at
    {
        get; set;
    }
    public string? error_message
    {
        get; set;
    }
}
