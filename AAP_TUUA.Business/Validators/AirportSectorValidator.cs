using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class AirportSectorValidator : AbstractValidator<AirportSector>
{
    public AirportSectorValidator()
    {
        RuleFor(x => x.airport_id).NotEmpty();
        RuleFor(x => x.code).NotEmpty().MaximumLength(20);
        RuleFor(x => x.name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.level).MaximumLength(20);
        RuleFor(x => x.description).MaximumLength(500);
    }
}
