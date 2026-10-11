using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class UbigeoProvinciaValidator : AbstractValidator<UbigeoProvincia>
{
    public UbigeoProvinciaValidator()
    {
        RuleFor(p => p.codigo).NotNull().NotEmpty().MaximumLength(10);
        RuleFor(p => p.codigo_departamento).NotNull().NotEmpty().MaximumLength(10);
        RuleFor(p => p.nombre).NotNull().NotEmpty().MaximumLength(100);
    }
}
