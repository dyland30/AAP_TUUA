namespace AAP_TUUA.Entidades;

public class Role
{
    public Guid? id { get; set; }
    public string? name { get; set; }
    public DateTime? created_at { get; set; }
    public DateTime? modified_at { get; set; }
    public string? created_by { get; set; }
    public string? modified_by { get; set; }
    
    public bool? is_active { get; set; }
    
    
    public List<RoleResource>? Resources { get; set; }
}