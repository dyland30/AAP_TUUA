using System.Data;
using AAP_TUUA.Entidades;
using Dapper;
using Npgsql;

namespace AAP_TUUA.Dao;

public class NotificationDao
{
    private readonly string _cnx;
    public NotificationDao(string cnx)
    {
        _cnx = cnx;
    }
    public async Task<List<Notification>> GetAll()
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<Notification>("select * from public.notification order by created_at desc, id desc")).ToList();
    }
    public async Task<Notification?> GetById(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return await cnn.QueryFirstOrDefaultAsync<Notification>("select * from public.notification where id = @id", new
        {
            id
        });
    }
    public async Task<List<Notification>> GetBySystemEventLogId(long systemEventLogId)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        return (await cnn.QueryAsync<Notification>("select * from public.notification where system_event_log_id = @systemEventLogId order by created_at desc, id desc", new
        {
            systemEventLogId
        })).ToList();
    }
    public async Task<Notification> Add(Notification entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        string query = @"insert into public.notification (system_event_log_id, notification_recipient_id, channel_id,
            recipient_address, subject, body, status_id, attempts, sent_at, error_message, created_at, updated_at, created_by, modified_by)
            values (@system_event_log_id, @notification_recipient_id, @channel_id, @recipient_address, @subject, @body,
            @status_id, @attempts, @sent_at, @error_message, @created_at, @updated_at, @created_by, @modified_by) returning id;";
        entity.id = await cnn.QuerySingleAsync<Guid>(query, entity);
        return entity;
    }
    public async Task Update(Notification entity)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync(@"update public.notification set system_event_log_id = @system_event_log_id,
            notification_recipient_id = @notification_recipient_id, channel_id = @channel_id, recipient_address = @recipient_address,
            subject = @subject, body = @body, status_id = @status_id, attempts = @attempts, sent_at = @sent_at,
            error_message = @error_message, updated_at = @updated_at, modified_by = @modified_by where id = @id;", entity);
    }
    public async Task Delete(Guid id)
    {
        using IDbConnection cnn = new NpgsqlConnection(_cnx);
        await cnn.ExecuteAsync("delete from public.notification where id = @id", new
        {
            id
        });
    }
}
