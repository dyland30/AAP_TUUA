using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class StandValidator : AbstractValidator<Stand>
{
    public StandValidator()
    {
        RuleFor(s => s.resource_id).NotEmpty();
        RuleFor(s => s.max_aircraft_size_type).NotEmpty();
        RuleFor(s => s.max_wingspan_m).GreaterThan(0).When(s => s.max_wingspan_m.HasValue);
    }
}
