namespace AAP_TUUA.Entidades;

// Cuadre registrado al cerrar un turno de caja.
public class CashierMachineSessionClosing
{
    public Guid? id { get; set; }
    public Guid cashier_machine_session_id { get; set; }
    public DateTime closing_date { get; set; }
    public bool has_difference { get; set; }
    public string? observation { get; set; }
    public DateTime? created_at { get; set; }
    public DateTime? updated_at { get; set; }
    public string? created_by { get; set; }
    public string? modified_by { get; set; }
    public List<CashierMachineSessionClosingDetail> details { get; set; } = new();
}

// Saldo esperado vs. monto declarado por moneda y tipo de pago.
public class CashierMachineSessionClosingDetail
{
    public Guid? id { get; set; }
    public Guid? cashier_machine_session_closing_id { get; set; }
    public int currency_id { get; set; }
    public int payment_type_id { get; set; }
    public decimal expected_amount { get; set; }
    public decimal declared_amount { get; set; }
    public decimal difference_amount { get; set; }
    public DateTime? created_at { get; set; }
    public DateTime? updated_at { get; set; }
    public string? created_by { get; set; }
    public string? modified_by { get; set; }
}

// Montos declarados por el cajero al cerrar su turno.
public class CashierMachineSessionCloseRequest
{
    public Guid cashier_machine_session_id { get; set; }
    public string? observation { get; set; }
    public List<CashierMachineSessionDeclaredAmount> declared_amounts { get; set; } = new();
}

public class CashierMachineSessionDeclaredAmount
{
    public int currency_id { get; set; }
    public int payment_type_id { get; set; }
    public decimal declared_amount { get; set; }
}

// Resumen del turno abierto para el cuadre: saldos esperados y movimientos por moneda.
public class CashierMachineSessionBalance
{
    public CashierMachineSession session { get; set; } = new();
    public CashierMachine cashier_machine { get; set; } = new();
    public string? operator_name { get; set; }
    public List<Feature> currencies { get; set; } = new();
    public List<Feature> payment_types { get; set; } = new();
    public int cash_payment_type_id { get; set; }
    public List<CashierMachineSessionExpectedAmount> expected_amounts { get; set; } = new();
    public List<CashierMachineSessionCurrencyTotals> currency_totals { get; set; } = new();
    public int sales_count { get; set; }
    public int tickets_count { get; set; }
}

public class CashierMachineSessionExpectedAmount
{
    public int currency_id { get; set; }
    public int payment_type_id { get; set; }
    public decimal expected_amount { get; set; }
}

// Origen de los movimientos de una moneda en el turno (montos con signo: ingresos +, egresos -).
public class CashierMachineSessionCurrencyTotals
{
    public int currency_id { get; set; }
    public decimal opening_amount { get; set; }
    public decimal sales_amount { get; set; }
    public decimal exchange_amount { get; set; }
    public decimal income_amount { get; set; }
    public decimal expense_amount { get; set; }
    public decimal balance_amount { get; set; }
}
