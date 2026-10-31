namespace AAP_TUUA.Entidades;

public class FlightCodeshare
{
    public Guid flight_id { get; set; }
    public Guid airline_id { get; set; }
    public string flight_identity { get; set; } = string.Empty;
}
