using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class AirportResourceValidator : AbstractValidator<AirportResource>
{
    public AirportResourceValidator()
    {
        RuleFor(r => r.resource_type_id).NotEmpty();
        RuleFor(r => r.terminal_id).NotEmpty();
        RuleFor(r => r.flight_type_id).NotEmpty();
        RuleFor(r => r.status_id).NotEmpty();
        RuleFor(r => r.code).NotEmpty().MaximumLength(20);
    }
}
