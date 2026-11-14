using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class OperationalAlertDao
{
    private readonly string _cnx;
    public OperationalAlertDao(string cnx)
    {
        _cnx = cnx;
    }
    public async Task<List<OperationalAlert>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<OperationalAlert>("select * from public.operational_alert order by detected_at desc, id desc")).ToList();
    }
    public async Task<OperationalAlert?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<OperationalAlert>("select * from public.operational_alert where id = @id", new
        {
            id
        });
    }
    public async Task<List<OperationalAlert>> GetByFlightId(Guid flightId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<OperationalAlert>("select * from public.operational_alert where flight_id = @flightId order by detected_at desc, id desc", new
        {
            flightId
        })).ToList();
    }
    public async Task<OperationalAlert> Add(OperationalAlert entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.operational_alert (airport_id, flight_id, alert_type_id, threshold_value,
            old_value, new_value, detected_at, notified_to, acknowledged_at, acknowledged_by, propagated_at, is_active,
            created_at, updated_at, created_by, modified_by) values (@airport_id, @flight_id, @alert_type_id,
            @threshold_value, @old_value, @new_value, @detected_at, @notified_to, @acknowledged_at, @acknowledged_by,
            @propagated_at, @is_active, @created_at, @updated_at, @created_by, @modified_by) returning id;";
        entity.id = await cnn.QuerySingleAsync<Guid>(query, entity);
        return entity;
    }
    public async Task Update(OperationalAlert entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"update public.operational_alert set airport_id = @airport_id, flight_id = @flight_id,
            alert_type_id = @alert_type_id, threshold_value = @threshold_value, old_value = @old_value, new_value = @new_value,
            detected_at = @detected_at, notified_to = @notified_to, acknowledged_at = @acknowledged_at,
            acknowledged_by = @acknowledged_by, propagated_at = @propagated_at, is_active = @is_active,
            updated_at = @updated_at, modified_by = @modified_by where id = @id;";
        await cnn.ExecuteAsync(query, entity);
    }
}
