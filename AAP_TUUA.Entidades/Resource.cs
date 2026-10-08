namespace AAP_TUUA.Entidades;

public class Resource
{
    public Guid? id { get; set; }
    public string? name { get; set; }
    public string? description { get; set; }
    public string? parent_description { get; set; }
    public string? type { get; set; }
    public string? path { get; set; }
    public string? method { get; set; }
    public Guid? parent_id { get; set; }
    public DateTime? created_at { get; set; }
    public DateTime? modified_at { get; set; }
    public string? created_by { get; set; }
    public string? modified_by { get; set; }

    public int? weight { get; set; }
    public string? icon { get; set; }
    public bool? is_active { get; set; }
}