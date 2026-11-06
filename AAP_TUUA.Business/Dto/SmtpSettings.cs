namespace AAP_TUUA.Business.Dto;

// Sección "Smtp" de appsettings.json.
public class SmtpSettings
{
    public string host { get; set; } = string.Empty;
    public int port { get; set; } = 587;
    public string? user { get; set; }
    public string? password { get; set; }
    public string from { get; set; } = string.Empty;
    public string? from_name { get; set; }
    public bool enable_ssl { get; set; } = true;
}
