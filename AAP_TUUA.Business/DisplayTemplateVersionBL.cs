using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business;

public class DisplayTemplateVersionBL
{
    private readonly DisplayTemplateVersionDao _dao;
    private readonly DisplayTemplateVersionValidator _validator = new();
    public DisplayTemplateVersionBL(string cnx)
    {
        _dao = new DisplayTemplateVersionDao(cnx);
    }
    public Task<List<DisplayTemplateVersion>> GetAll() => _dao.GetAll();
    public Task<DisplayTemplateVersion?> GetById(Guid id) => _dao.GetById(id);
    public Task<List<DisplayTemplateVersion>> GetByDisplayTemplateId(Guid displayTemplateId) => _dao.GetByDisplayTemplateId(displayTemplateId);
    public async Task<DisplayTemplateVersion> Add(DisplayTemplateVersion entity, string? userId)
    {
        await _validator.ValidateAndThrowAsync(entity);
        entity.published_at = entity.published_at?.ToUniversalTime();
        entity.created_at = entity.updated_at = DateTime.Now;
        entity.created_by = entity.modified_by = userId;
        return await _dao.Add(entity);
    }
    public async Task<DisplayTemplateVersion> Update(DisplayTemplateVersion entity, string? userId)
    {
        await _validator.ValidateAndThrowAsync(entity);
        if (entity.id is null || entity.id == Guid.Empty)
        {
            throw new Exception("Display template version id is required");
        }

        var existing = await _dao.GetById(entity.id.Value) ?? throw new Exception("Display template version not found");
        entity.published_at = entity.published_at?.ToUniversalTime();
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
            throw new Exception("Display template version not found");
        }

        await _dao.Delete(id);
    }
}
