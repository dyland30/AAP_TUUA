using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class TerminalValidator : AbstractValidator<Terminal>
{
    public TerminalValidator()
    {
        RuleFor(t => t.airport_id).NotEmpty();
        RuleFor(t => t.name).NotEmpty().MaximumLength(50);
    }
}
