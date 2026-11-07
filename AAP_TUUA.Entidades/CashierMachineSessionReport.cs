namespace AAP_TUUA.Entidades;

// Filtros del reporte de turnos de caja. El rango de fechas incluye ambos días y se aplica sobre la apertura
// (start_time). El aeropuerto y el terminal son los de la caja del turno.
public class CashierMachineSessionReportFilter
{
    public DateTime? date_from { get; set; }
    public DateTime? date_to { get; set; }
    public Guid? airport_id { get; set; }
    public Guid? terminal_id { get; set; }
    public int page { get; set; } = 1;
    public int page_size { get; set; } = 20;
}

// Resultado del reporte: la página de turnos, los totales de todos los turnos filtrados y los catálogos
// (monedas y tipos de vuelo) que forman las columnas de montos y tickets.
public class CashierMachineSessionReport
{
    public PagedResult<CashierMachineSessionReportItem> result { get; set; } = new();
    public CashierMachineSessionReportTotals totals { get; set; } = new();
    public List<Feature> currencies { get; set; } = new();
    public List<Feature> flight_types { get; set; } = new();
}

// Turno con su caja, ubicación, operador, estado, cuadre y resumen de ventas y movimientos.
public class CashierMachineSessionReportItem
{
    public Guid id { get; set; }
    public string cashier_machine_code { get; set; } = string.Empty;
    public Guid? terminal_id { get; set; }
    public string? terminal_name { get; set; }
    public Guid? airport_id { get; set; }
    public string? airport_name { get; set; }
    public string? airport_iata_code { get; set; }
    public string? operator_name { get; set; }
    public string? operator_email { get; set; }
    public DateTime start_time { get; set; }
    public DateTime? end_time { get; set; }
    public string? status_description { get; set; }
    public bool is_closed { get; set; }
    public bool? closing_has_difference { get; set; }
    public string? closing_observation { get; set; }
    public int sales_count { get; set; }
    public int tickets_count { get; set; }
    public List<CashierMachineSessionReportTickets> tickets { get; set; } = new();
    public List<CashierMachineSessionReportAmounts> amounts { get; set; } = new();
}

public class CashierMachineSessionReportTotals
{
    public int sessions_count { get; set; }
    public int sales_count { get; set; }
    public int tickets_count { get; set; }
    public List<CashierMachineSessionReportTickets> tickets { get; set; } = new();
    public List<CashierMachineSessionReportAmounts> amounts { get; set; } = new();
}

// Ventas y tickets emitidos (sin anulados) por tipo de vuelo.
public class CashierMachineSessionReportTickets
{
    public Guid? cashier_machine_session_id { get; set; }
    public int? flight_type_id { get; set; }
    public int sales_count { get; set; }
    public int tickets_count { get; set; }
}

// Montos de una moneda: ventas netas cobradas (con vuelto descontado), ingresos y egresos manuales, saldo
// del turno y diferencia declarada en el cuadre (null si el turno no tiene cuadre).
public class CashierMachineSessionReportAmounts
{
    public Guid? cashier_machine_session_id { get; set; }
    public int currency_id { get; set; }
    public decimal sales_amount { get; set; }
    public decimal income_amount { get; set; }
    public decimal expense_amount { get; set; }
    public decimal balance_amount { get; set; }
    public decimal? difference_amount { get; set; }
}
