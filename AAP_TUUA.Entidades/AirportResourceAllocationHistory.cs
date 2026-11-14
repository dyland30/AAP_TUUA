namespace AAP_TUUA.Entidades;

public class AirportResourceAllocationHistory
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
    public Guid airport_resource_allocation_id
    {
        get; set;
    }
    public Guid airport_resource_id
    {
        get; set;
    }
    public Guid? flight_id
    {
        get; set;
    }
    public Guid? airline_id
    {
        get; set;
    }
    public int action_id
    {
        get; set;
    }
    public Guid? previous_resource_id
    {
        get; set;
    }
    public DateTime action_at { get; set; } = DateTime.UtcNow;
    public string? action_by
    {
        get; set;
    }
    public int? source_id
    {
        get; set;
    }
    public string? notes
    {
        get; set;
    }
}
