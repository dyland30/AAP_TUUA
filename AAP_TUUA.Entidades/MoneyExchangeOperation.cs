namespace AAP_TUUA.Entidades;

public class MoneyExchangeOperation
{
    public Guid? id { get; set; }
    public Guid cashier_machine_session_id { get; set; }
    public DateTime operation_date { get; set; }
    public string operation_type { get; set; } = string.Empty;
    public int local_currency_id { get; set; }
    public int foreign_currency_id { get; set; }
    public Guid exchange_rate_id { get; set; }
    public decimal applied_exchange_rate { get; set; }
    public decimal local_currency_amount { get; set; }
    public decimal foreign_currency_amount { get; set; }
    public DateTime? created_at { get; set; }
    public DateTime? updated_at { get; set; }
    public string? created_by { get; set; }
    public string? modified_by { get; set; }
}
