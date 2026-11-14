using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business;

public class DisplayTemplateWidgetBL
{
    private readonly DisplayTemplateWidgetDao _dao;
    private readonly DisplayTemplateWidgetValidator _validator = new();
    public DisplayTemplateWidgetBL(string cnx)
    {
        _dao = new DisplayTemplateWidgetDao(cnx);
    }
    public Task<List<DisplayTemplateWidget>> GetAll() => _dao.GetAll();
    public Task<DisplayTemplateWidget?> GetById(Guid id) => _dao.GetById(id);
    public Task<List<DisplayTemplateWidget>> GetByDisplayTemplateVersionId(Guid displayTemplateVersionId) => _dao.GetByDisplayTemplateVersionId(displayTemplateVersionId);
    public async Task<DisplayTemplateWidget> Add(DisplayTemplateWidget entity, string? userId)
    {
        await _validator.ValidateAndThrowAsync(entity);
        entity.created_at = entity.updated_at = DateTime.Now;
        entity.created_by = entity.modified_by = userId;
        return await _dao.Add(entity);
    }
    public async Task<DisplayTemplateWidget> Update(DisplayTemplateWidget entity, string? userId)
    {
        await _validator.ValidateAndThrowAsync(entity);
        if (entity.id is null || entity.id == Guid.Empty)
        {
            throw new Exception("Display template widget id is required");
        }

        var existing = await _dao.GetById(entity.id.Value) ?? throw new Exception("Display template widget not found");
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
            throw new Exception("Display template widget not found");
        }

        await _dao.Delete(id);
    }
}
