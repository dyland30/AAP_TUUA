using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class ResourceValidator : AbstractValidator<Resource>
{
    public ResourceValidator()
    {
        RuleFor(r => r.name).NotNull().NotEmpty();
        RuleFor(r => r.path).NotNull().NotEmpty();
        RuleFor(r => r.type).NotNull().NotEmpty();
    }
}