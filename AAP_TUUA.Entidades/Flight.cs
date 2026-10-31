namespace AAP_TUUA.Entidades;

public class Flight
{
    public Guid? id { get; set; }
    public Guid airport_id { get; set; } //aeropuerto base de la operacion
    public Guid terminal_id { get; set; } //terminal del aeropuerto base de la operacion
    public Guid location_id { get; set; } //sede base de la operacion
    public Guid other_airport_id { get; set; } //origen (ARR) o destino (DEP)
    public string origin_airport_code { get; set; } = string.Empty;
    public string destination_airprt_code { get; set; } = string.Empty;
    public int flight_direction_id { get; set; } //de Features con Feature Group Name: Tipo Operación Vuelo
    public int? flight_type_id { get; set; } //de Features con Feature Group Name: Tipos de Vuelo
    public int service_type_id { get; set; } //de Features con Feature Group Name: Tipo Servicio IATA
    public Guid? aircraft_type_id { get; set; }
    public Guid? aircraft_id { get; set; }
    public Guid? airline_id { get; set; }
    public string? public_iata_code { get; set; }
    public string? operational_iata_code { get; set; }
    public string? flight_number { get; set; }
    public string? flight_identity { get; set; }
    public DateTime schedule_date { get; set; }
    public DateTime scheduled_time { get; set; } //STA / STD
    public DateTime? estimated_time { get; set; } //ETA / ETD (o EIBT / EOBT)
    public DateTime? actual_runway_time { get; set; } //ALDT / ATOT
    public DateTime? actual_block_time { get; set; } //AIBT / AOBT
    public int status_id { get; set; } //de Features con Feature Group Name: Estados de Vuelo
    public Guid? runway_id { get; set; }
    public Guid? diverted_to_id { get; set; } //Desviado a Aeropuerto
    public string? remarks { get; set; }
    public bool is_active { get; set; } = true;
    public DateTime? created_at { get; set; }
    public DateTime? updated_at { get; set; }
    public string? created_by { get; set; }
    public string? modified_by { get; set; }
}
