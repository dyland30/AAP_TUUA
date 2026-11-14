using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class DeviceDao
{
    private readonly string _cnx;
    public DeviceDao(string cnx)
    {
        _cnx = cnx;
    }
    public async Task<List<Device>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<Device>("select * from public.device order by code")).ToList();
    }
    public async Task<Device?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<Device>("select * from public.device where id = @id", new
        {
            id
        });
    }
    public async Task<List<Device>> GetByAirportId(Guid airportId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<Device>("select * from public.device where airport_id = @airportId order by code", new
        {
            airportId
        })).ToList();
    }
    public async Task<Device> Add(Device entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.device (airport_id, terminal_id, airport_sector_id, airport_resource_id, code, name,
            location_description, ip_address, mac_address, hostname, display_type_id, orientation_id, resolution_id, behavior_group_id,
            video_wall_id, video_wall_position, status_id, is_offline_mode, last_heartbeat_at, last_status_change_at, last_ntp_sync_at,
            clock_offset_ms, consecutive_errors, software_version, config_version, os_version, serial_number, manufacturer, model,
            ssh_port, vnc_port, remote_credential_ref, is_active, created_at, updated_at, created_by, modified_by)
            values (@airport_id, @terminal_id, @airport_sector_id, @airport_resource_id, @code, @name, @location_description,
            @ip_address, @mac_address, @hostname, @display_type_id, @orientation_id, @resolution_id, @behavior_group_id,
            @video_wall_id, @video_wall_position, @status_id, @is_offline_mode, @last_heartbeat_at, @last_status_change_at,
            @last_ntp_sync_at, @clock_offset_ms, @consecutive_errors, @software_version, @config_version, @os_version,
            @serial_number, @manufacturer, @model, @ssh_port, @vnc_port, @remote_credential_ref, @is_active,
            @created_at, @updated_at, @created_by, @modified_by) returning id;";
        entity.id = await cnn.QuerySingleAsync<Guid>(query, entity);
        return entity;
    }
    public async Task Update(Device entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.device set airport_id = @airport_id, terminal_id = @terminal_id,
            airport_sector_id = @airport_sector_id, airport_resource_id = @airport_resource_id, code = @code, name = @name,
            location_description = @location_description, ip_address = @ip_address, mac_address = @mac_address, hostname = @hostname,
            display_type_id = @display_type_id, orientation_id = @orientation_id, resolution_id = @resolution_id,
            behavior_group_id = @behavior_group_id, video_wall_id = @video_wall_id, video_wall_position = @video_wall_position,
            status_id = @status_id, is_offline_mode = @is_offline_mode, last_heartbeat_at = @last_heartbeat_at,
            last_status_change_at = @last_status_change_at, last_ntp_sync_at = @last_ntp_sync_at, clock_offset_ms = @clock_offset_ms,
            consecutive_errors = @consecutive_errors, software_version = @software_version, config_version = @config_version,
            os_version = @os_version, serial_number = @serial_number, manufacturer = @manufacturer, model = @model,
            ssh_port = @ssh_port, vnc_port = @vnc_port, remote_credential_ref = @remote_credential_ref, is_active = @is_active,
            updated_at = @updated_at, modified_by = @modified_by where id = @id;";
        await cnn.ExecuteAsync(query, entity);
    }
}
