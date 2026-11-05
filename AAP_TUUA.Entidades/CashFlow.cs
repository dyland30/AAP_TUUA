namespace AAP_TUUA.Entidades;

public class CashFlow
{
    public Guid? id { get; set; }
    public Guid cashier_machine_session_id { get; set; }
    public Guid? tuua_sales_operation_id { get; set; }
    public Guid? money_exchange_operation_id { get; set; }
    public string direction { get; set; } = string.Empty;
    public short @operator { get; set; }
    public int payment_type_id { get; set; }
    public int currency_id { get; set; }
    public decimal amount { get; set; }
    public string? reference_code { get; set; }
    public string? observation { get; set; }
    public bool is_active { get; set; } = true;
    public DateTime? created_at { get; set; }
    public DateTime? updated_at { get; set; }
    public string? created_by { get; set; }
    public string? modified_by { get; set; }
}
