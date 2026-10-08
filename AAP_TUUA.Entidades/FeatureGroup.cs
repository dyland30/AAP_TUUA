namespace AAP_TUUA.Entidades;

public class FeatureGroup
{
    public int id { get; set; }
    public string? name { get; set; }
    public string? description { get; set; }
    
    public List<Feature>? Features { get; set; }
    public string? created_by { get; set; }
    public string? modified_by { get; set; }
    public DateTime? created_date { get; set; }
    public DateTime? modified_date { get; set; }
}