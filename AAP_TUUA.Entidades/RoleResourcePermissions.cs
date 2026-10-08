namespace AAP_TUUA.Entidades;

public class RoleResourcePermissions
{
    public Guid? role_id { get; set; }
    public Guid? resource_id { get; set; }
    public int? permission_id { get; set; }
    public bool? is_active { get; set; }
    public DateTime? created_at { get; set; }
    public DateTime? updated_at { get; set; }
    public string? created_by { get; set; }
    public string? modified_by { get; set; }
    
    // non persistent properties
    public string? permission_name { get; set; }
    public string? resource_name { get; set; }
    public string? role_name { get; set; }
}