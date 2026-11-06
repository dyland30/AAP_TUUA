namespace AAP_TUUA.Entidades;

// Filtros de la búsqueda de operaciones de venta. El rango de fechas incluye ambos días.
public class TuuaSalesOperationSearchFilter
{
    public DateTime? date_from { get; set; }
    public DateTime? date_to { get; set; }
    public Guid? airport_id { get; set; }
    public Guid? terminal_id { get; set; }
    public int? status_id { get; set; }
}

// Operación de venta con la caja, terminal y aeropuerto donde se emitió, y sus tickets.
public class TuuaSalesOperationSearchItem : TuuaSalesOperation
{
    public string? cashier_machine_code { get; set; }
    public Guid? terminal_id { get; set; }
    public string? terminal_name { get; set; }
    public Guid? airport_id { get; set; }
    public string? airport_name { get; set; }
    public string? airport_iata_code { get; set; }
}
