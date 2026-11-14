namespace AAP_TUUA.Entidades;

public class LocalUserAirline
{
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
    public Guid local_user_id
    {
        get; set;
    }
    public Guid airline_id
    {
        get; set;
    }
    public bool is_active { get; set; } = true;
}
