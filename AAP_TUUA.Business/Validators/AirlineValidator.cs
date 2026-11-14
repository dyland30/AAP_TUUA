using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class AirlineValidator : AbstractValidator<Airline>
{
    public AirlineValidator()
    {
        RuleFor(a => a.company_name).NotNull().NotEmpty().MaximumLength(100);
        RuleFor(a => a.legal_name).MaximumLength(200);
        RuleFor(a => a.ruc).MaximumLength(30);
        RuleFor(a => a.cod_sap).MaximumLength(100);
        RuleFor(a => a.oaci_code).MaximumLength(5);
        RuleFor(a => a.iata_code).MaximumLength(5);
        RuleFor(a => a.short_name).MaximumLength(50);
        RuleFor(a => a.logo_url).MaximumLength(500);
        RuleFor(a => a.brand_color)
            .MaximumLength(9)
            .Matches("^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$")
            .When(a => !string.IsNullOrWhiteSpace(a.brand_color))
            .WithMessage("'brand_color' must be a hex color (#RRGGBB or #RRGGBBAA)");
    }
}
