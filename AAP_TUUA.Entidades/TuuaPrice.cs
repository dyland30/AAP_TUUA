namespace AAP_TUUA.Entidades;

public class TuuaPrice
{
    public Guid? id { get; set; }
    public int flight_type_id { get; set; } //de Features con Feature Group Name: Tipos de Vuelo
    public Guid location_id { get; set; }
    public Guid terminal_id { get; set; } 
    public int currency_id { get; set; } //de Features con Feature Group Name: Monedas
    public decimal price { get; set; }
    public DateTime date_start { get; set; }
    public DateTime? date_end { get; set; }
    public bool is_active { get; set; } = true;
    public DateTime? created_at { get; set; }
    public DateTime? updated_at { get; set; }
    public string? created_by { get; set; }
    public string? modified_by { get; set; }
}
