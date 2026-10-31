using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class FlightCodeshareValidator : AbstractValidator<FlightCodeshare>
{
    public FlightCodeshareValidator()
    {
        RuleFor(c => c.flight_id).NotEmpty();
        RuleFor(c => c.airline_id).NotEmpty();
        RuleFor(c => c.flight_identity).NotNull().NotEmpty().MaximumLength(10);
    }
}
