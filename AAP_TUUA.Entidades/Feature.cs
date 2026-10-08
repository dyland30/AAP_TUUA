namespace AAP_TUUA.Entidades;

public class Feature
{
    public int id { get; set; }
    public string? description { get; set; }
    public string? abbreviation { get; set; }
    public string? feature_value { get; set; }
    public bool is_active { get; set; }
    public int? parent_id { get; set; }
    public int feature_group_id { get; set; }
    public string? created_by { get; set; }
    public string? modified_by { get; set; }
    public DateTime? created_date { get; set; }
    public DateTime? modified_date { get; set; }
}