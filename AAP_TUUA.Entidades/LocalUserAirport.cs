namespace AAP_TUUA.Entidades;

public class LocalUserAirport
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
    public Guid airport_id
    {
        get; set;
    }
    public bool is_default
    {
        get; set;
    }
    public bool is_active { get; set; } = true;
}
