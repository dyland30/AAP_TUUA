namespace AAP_TUUA.Entidades;

public class FeatureTranslation
{
    public Guid? id
    {
        get; set;
    }
    public DateTime? created_at
    {
        get; set;
    }
    public DateTime? updated_at
    {
        get; set;
    }
    public string? created_by
    {
        get; set;
    }
    public string? modified_by
    {
        get; set;
    }
    public int feature_id
    {
        get; set;
    }
    public int language_id
    {
        get; set;
    }
    public string short_text { get; set; } = string.Empty;
    public string? long_text
    {
        get; set;
    }
    public bool is_active { get; set; } = true;
}
