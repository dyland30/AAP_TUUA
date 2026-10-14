using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class CashierMachineValidator : AbstractValidator<CashierMachine>
{
    public CashierMachineValidator()
    {
        RuleFor(c => c.terminal_id).NotEmpty();
        RuleFor(c => c.ipaddr).MaximumLength(50);
        RuleFor(c => c.description).MaximumLength(200);
    }
}
