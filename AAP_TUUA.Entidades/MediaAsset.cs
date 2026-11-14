namespace AAP_TUUA.Entidades;

public class MediaAsset
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
    public int media_type_id
    {
        get; set;
    }
    public string name { get; set; } = string.Empty;
    public string? storage_path
    {
        get; set;
    }
    public string? text_content
    {
        get; set;
    }
    public string? mime_type
    {
        get; set;
    }
    public long? file_size_bytes
    {
        get; set;
    }
    public int? width_px
    {
        get; set;
    }
    public int? height_px
    {
        get; set;
    }
    public int? duration_seconds
    {
        get; set;
    }
    public string? checksum_sha256
    {
        get; set;
    }
    public bool is_active { get; set; } = true;
}
