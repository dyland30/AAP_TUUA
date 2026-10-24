using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class PassengerLoadingBridgeDao
{
    private readonly string _cnx;

    public PassengerLoadingBridgeDao(string cnx)
    {
        _cnx = cnx;
    }

    public async Task<List<PassengerLoadingBridge>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<PassengerLoadingBridge>(
            "select * from public.passenger_loading_bridge");
        return result.ToList();
    }

    public async Task<List<PassengerLoadingBridge>> GetByBoardingGateId(Guid boardingGateId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<PassengerLoadingBridge>(
            "select * from public.passenger_loading_bridge where boarding_gate_id = @boardingGateId",
            new { boardingGateId });
        return result.ToList();
    }

    public async Task<List<PassengerLoadingBridge>> GetByStandId(Guid standId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        var result = await cnn.QueryAsync<PassengerLoadingBridge>(
            "select * from public.passenger_loading_bridge where stand_id = @standId", new { standId });
        return result.ToList();
    }

    public async Task<PassengerLoadingBridge?> GetById(Guid resourceId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<PassengerLoadingBridge>(
            "select * from public.passenger_loading_bridge where resource_id = @resourceId", new { resourceId });
    }

    public async Task<PassengerLoadingBridge> Add(PassengerLoadingBridge bridge)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.passenger_loading_bridge (resource_id, boarding_gate_id, stand_id,
                             bridge_type_id, door_position, max_aircraft_size_id, min_sill_height_m,
                             max_sill_height_m, has_pca, has_gpu_400hz, manufacturer, serial_number)
                         values (@resource_id, @boarding_gate_id, @stand_id,
                             @bridge_type_id, @door_position, @max_aircraft_size_id, @min_sill_height_m,
                             @max_sill_height_m, @has_pca, @has_gpu_400hz, @manufacturer, @serial_number);";
        await cnn.ExecuteAsync(query, bridge);
        return bridge;
    }

    public async Task Update(PassengerLoadingBridge bridge)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.passenger_loading_bridge
                         set boarding_gate_id = @boarding_gate_id,
                             stand_id = @stand_id,
                             bridge_type_id = @bridge_type_id,
                             door_position = @door_position,
                             max_aircraft_size_id = @max_aircraft_size_id,
                             min_sill_height_m = @min_sill_height_m,
                             max_sill_height_m = @max_sill_height_m,
                             has_pca = @has_pca,
                             has_gpu_400hz = @has_gpu_400hz,
                             manufacturer = @manufacturer,
                             serial_number = @serial_number
                         where resource_id = @resource_id;";
        await cnn.ExecuteAsync(query, bridge);
    }

    public async Task Delete(Guid resourceId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync(
            "delete from public.passenger_loading_bridge where resource_id = @resourceId", new { resourceId });
    }
}
