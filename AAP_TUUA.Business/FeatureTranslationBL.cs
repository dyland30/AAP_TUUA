using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business;

public class FeatureTranslationBL
{
    private readonly FeatureTranslationDao _dao;
    private readonly FeatureTranslationValidator _validator = new();
    public FeatureTranslationBL(string cnx)
    {
        _dao = new FeatureTranslationDao(cnx);
    }
    public Task<List<FeatureTranslation>> GetAll() => _dao.GetAll();
    public Task<FeatureTranslation?> GetById(Guid id) => _dao.GetById(id);
    public Task<List<FeatureTranslation>> GetByFeatureId(int featureId) => _dao.GetByFeatureId(featureId);
    public async Task<FeatureTranslation> Add(FeatureTranslation entity, string? userId)
    {
        await _validator.ValidateAndThrowAsync(entity);
        entity.created_at = entity.updated_at = DateTime.Now;
        entity.created_by = entity.modified_by = userId;
        entity.is_active = true;
        return await _dao.Add(entity);
    }
    public async Task<FeatureTranslation> Update(FeatureTranslation entity, string? userId)
    {
        await _validator.ValidateAndThrowAsync(entity);
        if (entity.id is null || entity.id == Guid.Empty)
        {
            throw new Exception("Feature translation id is required");
        }

        var existing = await _dao.GetById(entity.id.Value) ?? throw new Exception("Feature translation not found");
        entity.created_at = existing.created_at;
        entity.created_by = existing.created_by;
        entity.updated_at = DateTime.Now;
        entity.modified_by = userId;
        await _dao.Update(entity);
        return entity;
    }
    public async Task Delete(Guid id, string? userId)
    {
        var entity = await _dao.GetById(id) ?? throw new Exception("Feature translation not found");
        entity.is_active = false;
        await Update(entity, userId);
    }
}
