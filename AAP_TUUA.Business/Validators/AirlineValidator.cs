using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class AirlineValidator : AbstractValidator<Airline>
{
    public AirlineValidator()
    {
        RuleFor(a => a.company_name).NotNull().NotEmpty().MaximumLength(100);
        RuleFor(a => a.ruc).MaximumLength(30);
        RuleFor(a => a.cod_sap).MaximumLength(100);
        RuleFor(a => a.oaci_code).MaximumLength(5);
        RuleFor(a => a.iata_code).MaximumLength(5);
    }
}
