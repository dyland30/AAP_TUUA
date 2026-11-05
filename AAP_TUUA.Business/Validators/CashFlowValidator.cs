using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class CashFlowValidator : AbstractValidator<CashFlow>
{
    public CashFlowValidator()
    {
        RuleFor(c => c.cashier_machine_session_id).NotEmpty();
        RuleFor(c => c.direction).NotNull().NotEmpty().MaximumLength(1)
            .Must(d => d == "I" || d == "E")
            .WithMessage("Direction must be 'I' (income) or 'E' (expense)");
        RuleFor(c => c.@operator).Must(o => o == -1 || o == 1)
            .WithMessage("Operator must be -1 (expense) or 1 (income)");
        RuleFor(c => c.payment_type_id).NotEmpty();
        RuleFor(c => c.currency_id).NotEmpty();
        RuleFor(c => c.amount).GreaterThan(0).PrecisionScale(18, 2, true);
        RuleFor(c => c.reference_code).MaximumLength(50);
        RuleFor(c => c.observation).MaximumLength(500);
    }
}
