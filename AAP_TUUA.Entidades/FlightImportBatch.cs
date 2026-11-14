namespace AAP_TUUA.Entidades;

public class FlightImportBatch
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
    public Guid airport_id
    {
        get; set;
    }
    public int file_type_id
    {
        get; set;
    }
    public int status_id
    {
        get; set;
    }
    public string? file_name
    {
        get; set;
    }
    public long? file_size_bytes
    {
        get; set;
    }
    public string? storage_path
    {
        get; set;
    }
    public Guid? airline_id
    {
        get; set;
    }
    public DateTime? date_from
    {
        get; set;
    }
    public DateTime? date_to
    {
        get; set;
    }
    public int total_rows
    {
        get; set;
    }
    public int valid_rows
    {
        get; set;
    }
    public int error_rows
    {
        get; set;
    }
    public int duplicate_rows
    {
        get; set;
    }
    public int imported_rows
    {
        get; set;
    }
    public bool is_scheduled
    {
        get; set;
    }
    public DateTime? validated_at
    {
        get; set;
    }
    public DateTime? confirmed_at
    {
        get; set;
    }
    public string? confirmed_by
    {
        get; set;
    }
    public string? error_report_path
    {
        get; set;
    }
    public string? observation
    {
        get; set;
    }
    public bool is_active { get; set; } = true;
}
