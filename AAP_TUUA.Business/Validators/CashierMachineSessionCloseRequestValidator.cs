using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class CashierMachineSessionCloseRequestValidator : AbstractValidator<CashierMachineSessionCloseRequest>
{
    public CashierMachineSessionCloseRequestValidator()
    {
        RuleFor(c => c.cashier_machine_session_id).NotEmpty();
        RuleFor(c => c.observation).MaximumLength(500);
        RuleForEach(c => c.declared_amounts).ChildRules(amount =>
        {
            amount.RuleFor(a => a.currency_id).NotEmpty();
            amount.RuleFor(a => a.payment_type_id).NotEmpty();
            amount.RuleFor(a => a.declared_amount).GreaterThanOrEqualTo(0).PrecisionScale(18, 2, true);
        });
    }
}
