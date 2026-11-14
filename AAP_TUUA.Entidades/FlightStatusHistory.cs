namespace AAP_TUUA.Entidades;

public class FlightStatusHistory
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
    public int? previous_status_id
    {
        get; set;
    }
    public int new_status_id
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
    public DateTime changed_at { get; set; } = DateTime.UtcNow;
    public string? changed_by
    {
        get; set;
    }
    public DateTime? estimated_time
    {
        get; set;
    }
    public DateTime? actual_time
    {
        get; set;
    }
    public string? notes
    {
        get; set;
    }
}
