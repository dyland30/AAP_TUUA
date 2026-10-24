namespace AAP_TUUA.Entidades;

public class BaggageCarousel
{
    public Guid? resource_id { get; set; }
    public Guid terminal_id { get; set; }
    public int carousel_function_id { get; set; } //de Features con Feature Group Name: Función Faja de Equipaje
    public decimal? belt_length_m { get; set; }
}
