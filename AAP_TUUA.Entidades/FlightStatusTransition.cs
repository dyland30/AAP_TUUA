namespace AAP_TUUA.Entidades;

public class FlightStatusTransition
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
    public int from_status_id
    {
        get; set;
    }
    public int to_status_id
    {
        get; set;
    }
    public bool applies_to_departure { get; set; } = true;
    public bool applies_to_arrival { get; set; } = true;
    public bool allowed_for_airline
    {
        get; set;
    }
    public bool is_active { get; set; } = true;
}
