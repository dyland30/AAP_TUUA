using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class LocalUserCashierMachineValidator : AbstractValidator<LocalUserCashierMachine>
{
    public LocalUserCashierMachineValidator()
    {
        RuleFor(a => a.local_user_id).NotEmpty();
        RuleFor(a => a.cashier_machine_code).NotNull().NotEmpty().MaximumLength(20);
    }
}
