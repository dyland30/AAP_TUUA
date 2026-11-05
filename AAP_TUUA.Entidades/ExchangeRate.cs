namespace AAP_TUUA.Entidades;

public class ExchangeRate
{
    public Guid? id { get; set; }
    public DateTime day { get; set; }
    public int base_currency_id { get; set; }
    public int target_currency_id { get; set; }
    public decimal purchase_exchange_rate { get; set; }
    public decimal sales_exchange_rate { get; set; }
    public bool is_active { get; set; } = true;
    public DateTime? created_at { get; set; }
    public DateTime? updated_at { get; set; }
    public string? created_by { get; set; }
    public string? modified_by { get; set; }
}
