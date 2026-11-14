using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class EvacuationRouteValidator : AbstractValidator<EvacuationRoute>
{
    public EvacuationRouteValidator()
    {
        RuleFor(x => x.airport_sector_id).NotEmpty();
        RuleFor(x => x.code).NotEmpty().MaximumLength(20);
        RuleFor(x => x.name_es).NotEmpty().MaximumLength(200);
        RuleFor(x => x.name_en).MaximumLength(200);
        RuleFor(x => x.direction_icon).MaximumLength(50);
        RuleFor(x => x.exit_name).MaximumLength(100);
    }
}
