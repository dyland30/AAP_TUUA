namespace AAP_TUUA.Entidades;

public class BehaviorGroup
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
    public string code { get; set; } = string.Empty;
    public string name { get; set; } = string.Empty;
    public string? description
    {
        get; set;
    }
    public short? standard_number
    {
        get; set;
    }
    public bool is_standard
    {
        get; set;
    }
    public int? display_type_id
    {
        get; set;
    }
    public int content_type_id
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
    public short priority { get; set; } = 100;
    public bool is_emergency
    {
        get; set;
    }
    public short? page_duration_seconds
    {
        get; set;
    }
    public short? rows_per_page
    {
        get; set;
    }
    public short? alternate_interval_seconds
    {
        get; set;
    }
    public short? max_flights
    {
        get; set;
    }
    public bool is_active { get; set; } = true;
}
