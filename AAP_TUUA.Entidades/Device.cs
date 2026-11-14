namespace AAP_TUUA.Entidades;

public class Device
{
    public Guid? id
    {
        get; set;
    }
    public DateTime? created_at
    {
        get; set;
    }
    public DateTime? updated_at
    {
        get; set;
    }
    public string? created_by
    {
        get; set;
    }
    public string? modified_by
    {
        get; set;
    }
    public Guid airport_id
    {
        get; set;
    }
    public Guid? terminal_id
    {
        get; set;
    }
    public Guid? airport_sector_id
    {
        get; set;
    }
    public Guid? airport_resource_id
    {
        get; set;
    }
    public string code { get; set; } = string.Empty;
    public string? name
    {
        get; set;
    }
    public string? location_description
    {
        get; set;
    }
    public string? ip_address
    {
        get; set;
    }
    public string? mac_address
    {
        get; set;
    }
    public string? hostname
    {
        get; set;
    }
    public int display_type_id
    {
        get; set;
    }
    public int orientation_id
    {
        get; set;
    }
    public int resolution_id
    {
        get; set;
    }
    public Guid? behavior_group_id
    {
        get; set;
    }
    public Guid? video_wall_id
    {
        get; set;
    }
    public short? video_wall_position
    {
        get; set;
    }
    public int status_id
    {
        get; set;
    }
    public bool is_offline_mode
    {
        get; set;
    }
    public DateTime? last_heartbeat_at
    {
        get; set;
    }
    public DateTime? last_status_change_at
    {
        get; set;
    }
    public DateTime? last_ntp_sync_at
    {
        get; set;
    }
    public int? clock_offset_ms
    {
        get; set;
    }
    public int consecutive_errors
    {
        get; set;
    }
    public string? software_version
    {
        get; set;
    }
    public string? config_version
    {
        get; set;
    }
    public string? os_version
    {
        get; set;
    }
    public string? serial_number
    {
        get; set;
    }
    public string? manufacturer
    {
        get; set;
    }
    public string? model
    {
        get; set;
    }
    public int? ssh_port
    {
        get; set;
    }
    public int? vnc_port
    {
        get; set;
    }
    public string? remote_credential_ref
    {
        get; set;
    }
    public bool is_active { get; set; } = true;
}
