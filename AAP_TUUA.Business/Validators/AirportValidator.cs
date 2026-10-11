using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class AirportValidator : AbstractValidator<Airport>
{
    public AirportValidator()
    {
        RuleFor(a => a.iata_code).MaximumLength(5);
        RuleFor(a => a.oaci_code).MaximumLength(5);
        RuleFor(a => a.name).MaximumLength(500);
        RuleFor(a => a.city).MaximumLength(200);
        RuleFor(a => a.region).MaximumLength(200);
        RuleFor(a => a.country_code).MaximumLength(5);
        RuleFor(a => a.ubigeo).MaximumLength(10);
        RuleFor(a => a.latitude).PrecisionScale(10, 6, true);
        RuleFor(a => a.longitude).PrecisionScale(10, 6, true);
        RuleFor(a => a.timezone).MaximumLength(100);
        RuleFor(a => a.airport_type).MaximumLength(100);
    }
}
