namespace AAP_TUUA.Entidades;

public class AuditLog
{
    public DateTime? created_at
    {
        get; set;
    }
    public string? created_by
    {
        get; set;
    }
    public long id
    {
        get; set;
    }
    public Guid? airport_id
    {
        get; set;
    }
    public Guid? local_user_id
    {
        get; set;
    }
    public string? username
    {
        get; set;
    }
    public int action_id
    {
        get; set;
    }
    public string? entity_name
    {
        get; set;
    }
    public string? entity_id
    {
        get; set;
    }
    public string? description
    {
        get; set;
    }
    public string? old_values
    {
        get; set;
    }
    public string? new_values
    {
        get; set;
    }
    public string? ip_address
    {
        get; set;
    }
    public string? user_agent
    {
        get; set;
    }
    public DateTime occurred_at { get; set; } = DateTime.UtcNow;
}
