using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class LocationValidator : AbstractValidator<Location>
{
    public LocationValidator()
    {
        RuleFor(l => l.name).MaximumLength(500);
        RuleFor(l => l.description).MaximumLength(500);
        RuleFor(l => l.ubigeo).MaximumLength(10);
    }
}
