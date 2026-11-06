namespace AAP_TUUA.Entidades;

// Datos capturados en el punto de venta. Los importes se calculan en la BD
// (usp_insert_tuua_sales_operation) a partir del precio vigente, el IGV y el tipo de cambio.
public class TuuaTicketSaleRequest
{
    public Guid cashier_machine_session_id { get; set; }
    public int document_type_id { get; set; }
    public int sale_type_id { get; set; }
    public int flight_type_id { get; set; }
    public Guid flight_id { get; set; }
    public string titular_passenger_name { get; set; } = string.Empty;
    public string? passenger_email { get; set; }
    public int ticket_quantity { get; set; }
    public int payment_type_id { get; set; }
    public int? cash_payment_currency_id { get; set; }
    public decimal? cash_amount_payed { get; set; }
    public int? cash_change_currency_id { get; set; }
}
