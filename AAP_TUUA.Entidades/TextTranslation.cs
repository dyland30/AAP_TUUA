namespace AAP_TUUA.Entidades;

public class TextTranslation
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
    public Guid? airport_id
    {
        get; set;
    }
    public string text_key { get; set; } = string.Empty;
    public int language_id
    {
        get; set;
    }
    public string text_value { get; set; } = string.Empty;
    public string? context
    {
        get; set;
    }
    public bool is_active { get; set; } = true;
}
