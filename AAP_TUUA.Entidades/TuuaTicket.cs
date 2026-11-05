namespace AAP_TUUA.Entidades;

public class TuuaTicket
{
    public Guid? id { get; set; }
    public Guid? tuua_sales_operation_id { get; set; }
    public Guid document_sequential_numbers_id { get; set; }
    public string? tuua_gate_code { get; set; }
    public string serial { get; set; } = string.Empty;
    public long sequential_number { get; set; }
    public string hash_ticket { get; set; } = string.Empty;
    public int status_id { get; set; }
    public decimal price { get; set; }
    public decimal subtotal { get; set; }
    public decimal total { get; set; }
    public decimal igv_tax_amount { get; set; }
    public DateTime? utilization_date { get; set; }
    public DateTime? due_date { get; set; }
    public DateTime? created_at { get; set; }
    public DateTime? updated_at { get; set; }
    public string? created_by { get; set; }
    public string? modified_by { get; set; }
}
