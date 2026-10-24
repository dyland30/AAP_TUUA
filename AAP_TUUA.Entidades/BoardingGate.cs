namespace AAP_TUUA.Entidades;

public class BoardingGate
{
    public Guid? resource_id { get; set; }
    public int boarding_type_id { get; set; } //de Features con Feature Group Name: Tipo de Embarque
    public Guid? default_stand_id { get; set; }
    public bool is_active { get; set; } = true;
    public DateTime? created_at { get; set; }
    public DateTime? updated_at { get; set; }
    public string? created_by { get; set; }
    public string? modified_by { get; set; }
}
