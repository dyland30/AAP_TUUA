using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class UbigeoDepartamentoValidator : AbstractValidator<UbigeoDepartamento>
{
    public UbigeoDepartamentoValidator()
    {
        RuleFor(d => d.codigo).NotNull().NotEmpty().MaximumLength(10);
        RuleFor(d => d.nombre).NotNull().NotEmpty().MaximumLength(100);
    }
}
