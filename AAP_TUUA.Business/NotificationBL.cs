using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business;

public class NotificationBL
{
    private readonly NotificationDao _dao;
    private readonly NotificationValidator _validator = new();
    public NotificationBL(string cnx)
    {
        _dao = new NotificationDao(cnx);
    }
    public Task<List<Notification>> GetAll() => _dao.GetAll();
    public Task<Notification?> GetById(Guid id) => _dao.GetById(id);
    public Task<List<Notification>> GetBySystemEventLogId(long systemEventLogId) => _dao.GetBySystemEventLogId(systemEventLogId);
    public async Task<Notification> Add(Notification entity, string? userId)
    {
        await _validator.ValidateAndThrowAsync(entity);
        entity.sent_at = entity.sent_at?.ToUniversalTime();
        entity.created_at = entity.updated_at = DateTime.Now;
        entity.created_by = entity.modified_by = userId;
        return await _dao.Add(entity);
    }
    public async Task<Notification> Update(Notification entity, string? userId)
    {
        await _validator.ValidateAndThrowAsync(entity);
        if (entity.id is null || entity.id == Guid.Empty)
        {
            throw new Exception("Notification id is required");
        }

        var existing = await _dao.GetById(entity.id.Value) ?? throw new Exception("Notification not found");
        entity.sent_at = entity.sent_at?.ToUniversalTime();
        entity.created_at = existing.created_at;
        entity.created_by = existing.created_by;
        entity.updated_at = DateTime.Now;
        entity.modified_by = userId;
        await _dao.Update(entity);
        return entity;
    }
    public async Task Delete(Guid id, string? userId)
    {
        if (await _dao.GetById(id) is null)
        {
            throw new Exception("Notification not found");
        }

        await _dao.Delete(id);
    }
}
