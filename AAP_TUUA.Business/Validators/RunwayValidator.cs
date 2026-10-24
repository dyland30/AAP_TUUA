using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class RunwayValidator : AbstractValidator<Runway>
{
    public RunwayValidator()
    {
        RuleFor(r => r.airport_id).NotEmpty();
        RuleFor(r => r.designator).NotEmpty().MaximumLength(10);
        RuleFor(r => r.length_m).GreaterThan(0).When(r => r.length_m.HasValue);
        RuleFor(r => r.width_m).GreaterThan(0).When(r => r.width_m.HasValue);
        RuleFor(r => r.status_id).NotEmpty();
    }
}
