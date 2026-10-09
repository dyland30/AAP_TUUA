namespace AAP_TUUA.Business.Dto;

public class AuthenticationResult
{
    public Guid? user_id { get; set; }
    public string? email { get; set; }
    public string token { get; set; } = string.Empty;
    public int expires_in { get; set; }
    public string token_type { get; set; } = "bearer";
}
