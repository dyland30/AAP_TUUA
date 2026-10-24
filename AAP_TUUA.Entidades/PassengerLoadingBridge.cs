namespace AAP_TUUA.Entidades;

public class PassengerLoadingBridge
{
    public Guid? resource_id { get; set; }
    public Guid boarding_gate_id { get; set; }
    public Guid stand_id { get; set; }
    public int bridge_type_id { get; set; } //de Features con Feature Group Name: Tipos de PLB
    public string? door_position { get; set; } //'L1', 'L2', 'UD' (upper deck)
    public int max_aircraft_size_id { get; set; } //de Features con Feature Group Name: Aircraft Size Codes
    public decimal? min_sill_height_m { get; set; }
    public decimal? max_sill_height_m { get; set; }
    public bool has_pca { get; set; } = false;
    public bool has_gpu_400hz { get; set; } = false;
    public string? manufacturer { get; set; }
    public string? serial_number { get; set; }
}
