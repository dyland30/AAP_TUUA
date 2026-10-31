using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class AircraftValidator : AbstractValidator<Aircraft>
{
    public AircraftValidator()
    {
        RuleFor(a => a.registration).NotNull().NotEmpty().MaximumLength(20);
        RuleFor(a => a.aircraft_type_id).NotEmpty();
        RuleFor(a => a.seat_count).GreaterThan(0).When(a => a.seat_count.HasValue);
    }
}
