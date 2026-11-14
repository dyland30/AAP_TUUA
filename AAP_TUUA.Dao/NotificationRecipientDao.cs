using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class NotificationRecipientDao
{
    private readonly string _cnx;
    public NotificationRecipientDao(string cnx)
    {
        _cnx = cnx;
    }
    public async Task<List<NotificationRecipient>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<NotificationRecipient>("select * from public.notification_recipient order by recipient_address, id")).ToList();
    }
    public async Task<NotificationRecipient?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<NotificationRecipient>("select * from public.notification_recipient where id = @id", new
        {
            id
        });
    }
    public async Task<List<NotificationRecipient>> GetByAirportId(Guid airportId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<NotificationRecipient>("select * from public.notification_recipient where airport_id = @airportId order by recipient_address, id", new
        {
            airportId
        })).ToList();
    }
    public async Task<NotificationRecipient> Add(NotificationRecipient entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.notification_recipient (airport_id, event_type_id, channel_id, local_user_id,
            recipient_address, min_level_id, is_active, created_at, updated_at, created_by, modified_by)
            values (@airport_id, @event_type_id, @channel_id, @local_user_id, @recipient_address, @min_level_id,
            @is_active, @created_at, @updated_at, @created_by, @modified_by) returning id;";
        entity.id = await cnn.QuerySingleAsync<Guid>(query, entity);
        return entity;
    }
    public async Task Update(NotificationRecipient entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync(@"update public.notification_recipient set airport_id = @airport_id, event_type_id = @event_type_id,
            channel_id = @channel_id, local_user_id = @local_user_id, recipient_address = @recipient_address,
            min_level_id = @min_level_id, is_active = @is_active, updated_at = @updated_at, modified_by = @modified_by where id = @id;", entity);
    }
}
