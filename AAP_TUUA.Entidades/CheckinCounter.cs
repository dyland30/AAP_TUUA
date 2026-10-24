namespace AAP_TUUA.Entidades;

public class CheckinCounter
{
    public Guid? resource_id { get; set; }
    public Guid terminal_id { get; set; }
    public string island { get; set; } = string.Empty;
    public int counter_type_id { get; set; } //de Features con Feature Group Name: Tipo de Checkin
    public bool has_baggage_belt { get; set; } = true;
    public bool is_common_use { get; set; } = true; //CUTE / CUPPS
}
