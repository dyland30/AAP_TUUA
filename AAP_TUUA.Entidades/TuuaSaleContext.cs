namespace AAP_TUUA.Entidades;

// Información del turno abierto y catálogos necesarios para el punto de venta de tickets TUUA.
public class TuuaSaleContext
{
    public CashierMachineSession session { get; set; } = new();
    public CashierMachine cashier_machine { get; set; } = new();
    public Terminal? terminal { get; set; }
    public Location? location { get; set; }
    public Airport? airport { get; set; }
    public decimal igv_rate { get; set; }
    public int flight_days { get; set; }
    public int national_currency_id { get; set; }
    public List<Feature> document_types { get; set; } = new();
    public List<Feature> sale_types { get; set; } = new();
    public List<Feature> payment_types { get; set; } = new();
    public List<Feature> currencies { get; set; } = new();
    public List<Feature> flight_types { get; set; } = new();
}

// Precio vigente y tipo de cambio aplicables a un tipo de vuelo en la caja del turno abierto.
public class TuuaSalePricing
{
    public TuuaPrice tuua_price { get; set; } = new();
    public ExchangeRate exchange_rate { get; set; } = new();
}

public class TuuaTicketEmailRequest
{
    public string? email { get; set; }
}
