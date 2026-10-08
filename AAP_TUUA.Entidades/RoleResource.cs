namespace AAP_TUUA.Entidades;

public class RoleResource
{
    public Guid? role_id { get; set; }
    public Guid? resource_id { get; set; }
    public DateTime? created_at { get; set; }
    public DateTime? modified_at { get; set; }
    public string? created_by { get; set; }
    public string? modified_by { get; set; }
    
    //navigation properties
    public List<RoleResourcePermissions>? PermissionsList { get; set; }
    public Resource? Resource { get; set; }
}