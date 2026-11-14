namespace AAP_TUUA.Entidades;

public class FlightImportRow
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
    public Guid flight_import_batch_id
    {
        get; set;
    }
    public int row_number
    {
        get; set;
    }
    public int status_id
    {
        get; set;
    }
    public int? reconciliation_action_id
    {
        get; set;
    }
    public bool is_selected { get; set; } = true;
    public string? airline_code
    {
        get; set;
    }
    public Guid? airline_id
    {
        get; set;
    }
    public string? flight_number
    {
        get; set;
    }
    public string? flight_direction_code
    {
        get; set;
    }
    public string? origin_airport_code
    {
        get; set;
    }
    public string? destination_airport_code
    {
        get; set;
    }
    public DateTime? flight_date
    {
        get; set;
    }
    public TimeSpan? scheduled_time_utc
    {
        get; set;
    }
    public TimeSpan? scheduled_time_local
    {
        get; set;
    }
    public string? service_type_code
    {
        get; set;
    }
    public string? aircraft_type_code
    {
        get; set;
    }
    public string? days_of_week
    {
        get; set;
    }
    public DateTime? valid_from
    {
        get; set;
    }
    public DateTime? valid_to
    {
        get; set;
    }
    public string? raw_data
    {
        get; set;
    }
    public string? error_detail
    {
        get; set;
    }
    public Guid? existing_flight_id
    {
        get; set;
    }
    public Guid? flight_id
    {
        get; set;
    }
}
