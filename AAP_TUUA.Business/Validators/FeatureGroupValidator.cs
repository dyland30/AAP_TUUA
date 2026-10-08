using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class FeatureGroupValidator : AbstractValidator<FeatureGroup>
{
    public FeatureGroupValidator()
    {
        RuleFor(x => x.name).NotEmpty().NotNull();
        
    }
}