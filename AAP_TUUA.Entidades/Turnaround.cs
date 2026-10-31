namespace AAP_TUUA.Entidades;

public class Turnaround
{
    public Guid? id { get; set; }
    public Guid? arrival_flight_id { get; set; }
    public Guid? departure_flight_id { get; set; }
    public int? min_ground_time { get; set; }
    public DateTime? created_at { get; set; }
    public DateTime? updated_at { get; set; }
    public string? created_by { get; set; }
    public string? modified_by { get; set; }
}
