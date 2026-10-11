namespace AAP_TUUA.Entidades;

public class Location
{
    public Guid? id { get; set; }
    public Guid? airport_id { get; set; }
    public string? name { get; set; }
    public string? description { get; set; }
    public string? ubigeo { get; set; }
}
