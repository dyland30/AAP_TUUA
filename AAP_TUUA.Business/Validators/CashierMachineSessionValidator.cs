using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class CashierMachineSessionValidator : AbstractValidator<CashierMachineSession>
{
    public CashierMachineSessionValidator()
    {
        RuleFor(c => c.cashier_machine_code).NotNull().NotEmpty().MaximumLength(20);
        RuleFor(c => c.local_user_id).NotEmpty();
        RuleFor(c => c.start_time).NotEmpty();
        RuleFor(c => c.end_time)
            .GreaterThanOrEqualTo(c => c.start_time)
            .When(c => c.end_time.HasValue);
        RuleFor(c => c.status_id).NotEmpty();
    }
}
