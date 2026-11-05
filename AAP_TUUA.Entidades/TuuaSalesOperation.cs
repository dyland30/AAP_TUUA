namespace AAP_TUUA.Entidades;

public class TuuaSalesOperation
{
    public Guid? id { get; set; }
    public Guid cashier_machine_session_id { get; set; }
    public DateTime operation_date { get; set; }
    public int document_type_id { get; set; }
    public int seae_type_id { get; set; }
    public int sale_type_id { get; set; }
    public int currency_id { get; set; }
    public int? flight_type_id { get; set; }
    public Guid? airline_id { get; set; }
    public string? flight_number { get; set; }
    public DateTime? flight_date { get; set; }
    public Guid? flight_id { get; set; }
    public string? titular_passenger_name { get; set; }
    public string? passenger_email { get; set; }
    public Guid exchange_rate_id { get; set; }
    public decimal purchase_exchange_rate { get; set; }
    public decimal sales_exchange_rate { get; set; }
    public int payment_type_id { get; set; }
    public int status_id { get; set; }
    public int ticket_quantity { get; set; }
    public decimal unit_price { get; set; }
    public Guid tuua_price_id { get; set; }
    public decimal subtotal { get; set; }
    public decimal total { get; set; }
    public decimal igv_tax_amount { get; set; }
    public decimal? cash_amount_payed { get; set; }
    public decimal? cash_change { get; set; }
    public string? payment_id { get; set; }
    public string? payment_authorization { get; set; }
    public string? payment_card_brand { get; set; }
    public string? payment_holder_name { get; set; }
    public string? payment_status { get; set; }
    public decimal? payment_amount { get; set; }
    public string? payment_currency { get; set; }
    public DateTime? payment_date { get; set; }
    public string? payment_response { get; set; }
    public DateTime? created_at { get; set; }
    public DateTime? updated_at { get; set; }
    public string? created_by { get; set; }
    public string? modified_by { get; set; }
    public List<TuuaTicket> tickets { get; set; } = new();
}
