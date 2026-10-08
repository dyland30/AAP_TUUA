namespace AAP_TUUA.Entidades;

public class UserRole
{
    public Guid? user_id { get; set; }
    public Guid? role_id { get; set; }
    public DateTime? created_at { get; set; }
    public DateTime? modified_at { get; set; }
    public string? created_by { get; set; }
    public string? modified_by { get; set; }
}