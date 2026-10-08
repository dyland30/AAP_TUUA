using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class FeatureValidator : AbstractValidator<Feature>
{
    public FeatureValidator()
    {
        RuleFor(f => f.description).NotEmpty().NotNull();
        RuleFor(f => f.feature_value).NotEmpty().NotNull();
        RuleFor(f => f.is_active).NotNull();
        RuleFor(f => f.feature_group_id).NotNull();
        
        
    }
}