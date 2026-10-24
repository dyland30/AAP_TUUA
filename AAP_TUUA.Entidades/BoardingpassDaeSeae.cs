namespace AAP_TUUA.Entidades;

public class BoardingpassDaeSeae
{
    public long? id { get; set; }
    public Guid document_sequential_numbers_id { get; set; }
    public string serial { get; set; } = string.Empty;
    public long sequential_number { get; set; }
    public string tuua_gate_code { get; set; } = string.Empty;
    public int flight_type_id { get; set; }  //de Features con Feature Group Name: Tipos de Vuelo
    public Guid airline_id { get; set; }
    public decimal price { get; set; }
    public int currency_id { get; set; } //de Features con Feature Group Name: Monedas
    public int status_id { get; set; } //de Features con Feature Group Name: Estados Boardingpass
    public string flight_number { get; set; } = string.Empty;
    public DateTime flight_date { get; set; }
    public string passenger_name { get; set; } = string.Empty;
    public string? seat_number { get; set; }
    public string? pnr { get; set; }
    public int? checkin_sequence_number { get; set; }
    public string origin_airport_code { get; set; } = string.Empty;
    public string destination_airport_code { get; set; } = string.Empty;
    public string passenger_status { get; set; } = string.Empty;
    public string? str_bcbp { get; set; }
    public int? ose_status_id { get; set; } //de Features con Feature Group Name: Estados OSE
    public string? ose_response { get; set; }
    public DateTime? created_at { get; set; }
    public DateTime? updated_at { get; set; }
    public string? created_by { get; set; }
    public string? modified_by { get; set; }
}
