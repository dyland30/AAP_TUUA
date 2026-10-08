using AAP_TUUA.Business.Validators;
using AAP_TUUA.Dao;
using AAP_TUUA.Entidades;

namespace AAP_TUUA.Business;

public class FeatureBL
{
    private readonly FeatureDao _featureDao;
    private readonly FeatureGroupValidator _featureGroupValidator;
    private readonly FeatureValidator _featureValidator;

    public FeatureBL(string _cnx)
    {
        var cnx = _cnx;

        _featureDao = new FeatureDao(cnx);
        _featureGroupValidator = new FeatureGroupValidator();
        _featureValidator = new FeatureValidator();
    }

    public async Task<IEnumerable<FeatureGroup>?> GetAllFeatureGroups()
    {
        var featureGroups = await _featureDao.GetAllFeatureGroup();
        return featureGroups;
    }

    public async Task<IEnumerable<Feature>?> GetFeaturesByGroup(int groupId)
    {
        var features = await _featureDao.GetByFeatureGroup(groupId);
        return features;
    }

    public async Task<FeatureGroup> AddFeatureGroup(FeatureGroup featureGroup, string? userId)
    {
        var result = await _featureGroupValidator.ValidateAsync(featureGroup);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        featureGroup.created_date = DateTime.Now;
        featureGroup.modified_date = DateTime.Now;
        featureGroup.created_by = userId;
        featureGroup.modified_by = userId;
        var fGroup = await _featureDao.AddFeatureGroup(featureGroup);

        return fGroup;
    }

    public async Task<FeatureGroup> UpdateFeatureGroup(FeatureGroup featureGroup, string? userId)
    {
        var result = await _featureGroupValidator.ValidateAsync(featureGroup);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        featureGroup.modified_date = DateTime.Now;
        featureGroup.modified_by = userId;

        await _featureDao.UpdateFeatureGroup(featureGroup);

        return featureGroup;
    }

    public async Task<Feature> AddFeature(Feature feature, string? userId)
    {
        var result = await _featureValidator.ValidateAsync(feature);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        feature.created_date = DateTime.Now;
        feature.modified_date = DateTime.Now;
        feature.created_by = userId;
        feature.modified_by = userId;

        var f = await _featureDao.AddFeature(feature);

        return f;
    }

    public async Task<Feature> UpdateFeature(Feature feature, string? userId)
    {
        var result = await _featureValidator.ValidateAsync(feature);
        if (!result.IsValid)
        {
            var error = string.Join(',', result.Errors.Select(x => x.ErrorMessage));
            throw new Exception(error);
        }

        feature.modified_date = DateTime.Now;

        feature.modified_by = userId;
        await _featureDao.UpdateFeature(feature);

        return feature;
    }
}