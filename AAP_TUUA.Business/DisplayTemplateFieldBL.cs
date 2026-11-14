using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business;

public class DisplayTemplateFieldBL
{
    private readonly DisplayTemplateFieldDao _dao;
    private readonly DisplayTemplateFieldValidator _validator = new();
    public DisplayTemplateFieldBL(string cnx)
    {
        _dao = new DisplayTemplateFieldDao(cnx);
    }
    public Task<List<DisplayTemplateField>> GetAll() => _dao.GetAll();
    public Task<DisplayTemplateField?> GetById(Guid id) => _dao.GetById(id);
    public Task<List<DisplayTemplateField>> GetByDisplayTemplateVersionId(Guid displayTemplateVersionId) => _dao.GetByDisplayTemplateVersionId(displayTemplateVersionId);
    public async Task<DisplayTemplateField> Add(DisplayTemplateField entity, string? userId)
    {
        await _validator.ValidateAndThrowAsync(entity);
        entity.created_at = entity.updated_at = DateTime.Now;
        entity.created_by = entity.modified_by = userId;
        return await _dao.Add(entity);
    }
    public async Task<DisplayTemplateField> Update(DisplayTemplateField entity, string? userId)
    {
        await _validator.ValidateAndThrowAsync(entity);
        if (entity.id is null || entity.id == Guid.Empty)
        {
            throw new Exception("Display template field id is required");
        }

        var existing = await _dao.GetById(entity.id.Value) ?? throw new Exception("Display template field not found");
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
            throw new Exception("Display template field not found");
        }

        await _dao.Delete(id);
    }
}
