namespace AAP_TUUA.Entidades;

public class Stand
{
    public Guid? resource_id { get; set; }
    public bool is_contact { get; set; } = true;
    public int max_aircraft_size_type { get; set; } //de Features con Feature Group Name: Aircraft Size Codes
    public decimal? max_wingspan_m { get; set; }
    public bool has_fixed_gpu { get; set; } = false;
    public bool has_pca { get; set; } = false;
    public bool has_fuel_hydrant { get; set; } = false;
}
