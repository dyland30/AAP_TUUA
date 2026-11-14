using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class FlightStatusTransitionValidator : AbstractValidator<FlightStatusTransition>
{
    public FlightStatusTransitionValidator()
    {
        RuleFor(x => x.from_status_id).GreaterThan(0);
        RuleFor(x => x.to_status_id).GreaterThan(0).NotEqual(x => x.from_status_id);
    }
}
