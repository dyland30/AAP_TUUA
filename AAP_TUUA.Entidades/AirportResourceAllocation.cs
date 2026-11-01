namespace AAP_TUUA.Entidades;

public class AirportResourceAllocation
{
    public Guid? id { get; set; }
    public Guid airport_resource_id { get; set; }
    public Guid? flight_id { get; set; }
    public Guid? turnaround_id { get; set; }
    public Guid? airline_id { get; set; }
    public DateTime star_time { get; set; }
    public DateTime? end_time { get; set; }
    public int status_id { get; set; }
    public bool is_shared { get; set; } = false;
    public string? notes { get; set; }
    public bool is_active { get; set; } = true;
    public DateTime? created_at { get; set; }
    public DateTime? updated_at { get; set; }
    public string? created_by { get; set; }
    public string? modified_by { get; set; }
}
