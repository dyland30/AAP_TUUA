namespace AAP_TUUA.Entidades;

// Filtros de la consulta de boardingpass registrados. El rango de fechas incluye ambos días y se aplica
// sobre la fecha de registro; el rango de horas acota la hora de registro dentro de cada día.
public class BoardingpassSearchFilter
{
    public DateTime? date_from { get; set; }
    public DateTime? date_to { get; set; }
    public TimeSpan? time_from { get; set; }
    public TimeSpan? time_to { get; set; }
    public Guid? airport_id { get; set; }
    public Guid? terminal_id { get; set; }
    public int? flight_type_id { get; set; }
    public int? status_id { get; set; }
    public int page { get; set; } = 1;
    public int page_size { get; set; } = 20;
}

// Boardingpass con la terminal y el aeropuerto de la puerta TUUA donde se registró.
public class BoardingpassSearchItem : BoardingpassDaeSeae
{
    public Guid? terminal_id { get; set; }
    public string? terminal_name { get; set; }
    public Guid? airport_id { get; set; }
    public string? airport_name { get; set; }
    public string? airport_iata_code { get; set; }
}

// Boardingpass para exportación: agrega las descripciones de los catálogos asociados.
public class BoardingpassExportItem : BoardingpassSearchItem
{
    public string? flight_type_description { get; set; }
    public string? status_description { get; set; }
    public string? ose_status_description { get; set; }
    public string? currency_code { get; set; }
}

public class PagedResult<T>
{
    public List<T> items { get; set; } = new();
    public int total { get; set; }
    public int page { get; set; }
    public int page_size { get; set; }
}
