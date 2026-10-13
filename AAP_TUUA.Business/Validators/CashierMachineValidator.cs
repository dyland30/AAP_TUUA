using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class CashierMachineValidator : AbstractValidator<CashierMachine>
{
    public CashierMachineValidator()
    {
        RuleFor(c => c.terminal_id).NotEmpty();
    }
}
