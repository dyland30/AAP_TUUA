namespace AAP_TUUA.Entidades;

public class LocalUser
{
    public Guid? id { get; set; }
    public string? name { get; set; }
    public string? email { get; set; }
    public string? password_salt { get; set; }
    public string? password_hash { get; set; }
    public string? password_reset_token { get; set; }
    public DateTime? password_reset_token_expires_at { get; set; }
    public DateTime? created_at { get; set; }
    public DateTime? modified_at { get; set; }
    public string? created_by { get; set; }
    public string? modified_by { get; set; }
    public bool is_active { get; set; }
    public bool is_deleted { get; set; }
    public bool is_verified { get; set; }
    public string? verification_code { get; set; }
    public string? reset_password_code { get; set; }
    public DateTime? last_login_at { get; set; }
    
    public bool is_external { get; set; }

    
    // transient fields
    public string? password { get; set; }
    public string? confirm_password { get; set; }
    
    public List<Role>? Roles { get; set; }
}