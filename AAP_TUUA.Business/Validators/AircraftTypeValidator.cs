using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class AircraftTypeValidator : AbstractValidator<AircraftType>
{
    public AircraftTypeValidator()
    {
        RuleFor(a => a.icao_code).NotNull().NotEmpty().MaximumLength(4);
        RuleFor(a => a.iata_code).MaximumLength(3);
        RuleFor(a => a.manufacturer_id).NotEmpty();
        RuleFor(a => a.model).NotNull().NotEmpty();
        RuleFor(a => a.size_code_id).NotEmpty();
        RuleFor(a => a.wingspan_m).GreaterThan(0).When(a => a.wingspan_m.HasValue);
        RuleFor(a => a.length_m).GreaterThan(0).When(a => a.length_m.HasValue);
        RuleFor(a => a.max_seats).GreaterThan(0).When(a => a.max_seats.HasValue);
    }
}
