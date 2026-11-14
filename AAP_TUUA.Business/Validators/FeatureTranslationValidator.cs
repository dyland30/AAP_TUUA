using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class FeatureTranslationValidator : AbstractValidator<FeatureTranslation>
{
    public FeatureTranslationValidator()
    {
        RuleFor(x => x.feature_id).GreaterThan(0);
        RuleFor(x => x.language_id).GreaterThan(0);
        RuleFor(x => x.short_text).NotEmpty().MaximumLength(100);
        RuleFor(x => x.long_text).MaximumLength(500);
    }
}
