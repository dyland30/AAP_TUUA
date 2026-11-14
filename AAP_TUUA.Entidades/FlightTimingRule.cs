namespace AAP_TUUA.Entidades;

public class FlightTimingRule
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
    public Guid? terminal_id
    {
        get; set;
    }
    public Guid? airport_sector_id
    {
        get; set;
    }
    public int event_type_id
    {
        get; set;
    }
    public int reference_time_id
    {
        get; set;
    }
    public int? flight_direction_id
    {
        get; set;
    }
    public int? flight_type_id
    {
        get; set;
    }
    public Guid? airline_id
    {
        get; set;
    }
    public Guid? destination_airport_id
    {
        get; set;
    }
    public int? resource_type_id
    {
        get; set;
    }
    public int offset_minutes
    {
        get; set;
    }
    public short priority { get; set; } = 100;
    public string? description
    {
        get; set;
    }
    public bool is_active { get; set; } = true;
}
