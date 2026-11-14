using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class DisplayTemplateValidator : AbstractValidator<DisplayTemplate>
{
    public DisplayTemplateValidator()
    {
        RuleFor(x => x.code).NotEmpty().MaximumLength(50);
        RuleFor(x => x.name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.description).MaximumLength(500);
        RuleFor(x => x.display_type_id).GreaterThan(0);
        RuleFor(x => x.orientation_id).GreaterThan(0);
        RuleFor(x => x.resolution_id).GreaterThan(0);
    }
}
