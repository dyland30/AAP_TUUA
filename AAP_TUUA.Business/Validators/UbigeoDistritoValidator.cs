using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class UbigeoDistritoValidator : AbstractValidator<UbigeoDistrito>
{
    public UbigeoDistritoValidator()
    {
        RuleFor(d => d.codigo).NotNull().NotEmpty().MaximumLength(10);
        RuleFor(d => d.codigo_provincia).NotNull().NotEmpty().MaximumLength(10);
        RuleFor(d => d.nombre).NotNull().NotEmpty().MaximumLength(100);
    }
}
