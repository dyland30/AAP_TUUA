using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class FlightTimingRuleValidator : AbstractValidator<FlightTimingRule>
{
    public FlightTimingRuleValidator()
    {
        RuleFor(x => x.airport_id).NotEmpty();
        RuleFor(x => x.event_type_id).GreaterThan(0);
        RuleFor(x => x.reference_time_id).GreaterThan(0);
        RuleFor(x => x.description).MaximumLength(200);
    }
}
