namespace AAP_TUUA.Entidades;

public class FlightChangeHistory
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
    public Guid flight_id
    {
        get; set;
    }
    public string field_name { get; set; } = string.Empty;
    public string? old_value
    {
        get; set;
    }
    public string? new_value
    {
        get; set;
    }
    public int? source_id
    {
        get; set;
    }
    public Guid? integration_message_id
    {
        get; set;
    }
    public bool was_rejected_by_lock
    {
        get; set;
    }
    public DateTime changed_at { get; set; } = DateTime.UtcNow;
    public string? changed_by
    {
        get; set;
    }
}
