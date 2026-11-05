using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class MoneyExchangeOperationValidator : AbstractValidator<MoneyExchangeOperation>
{
    public MoneyExchangeOperationValidator()
    {
        RuleFor(o => o.cashier_machine_session_id).NotEmpty();
        RuleFor(o => o.operation_date).NotEmpty();
        RuleFor(o => o.operation_type).NotNull().NotEmpty().MaximumLength(1)
            .Must(t => t == "S" || t == "P")
            .WithMessage("Operation type must be 'S' (sale) or 'P' (purchase)");
        RuleFor(o => o.local_currency_id).NotEmpty();
        RuleFor(o => o.foreign_currency_id).NotEmpty()
            .Must((o, foreign) => foreign != o.local_currency_id)
            .WithMessage("Local and foreign currency must be different");
        RuleFor(o => o.exchange_rate_id).NotEmpty();
        RuleFor(o => o.applied_exchange_rate).GreaterThan(0).PrecisionScale(10, 3, true);
        RuleFor(o => o.local_currency_amount).GreaterThan(0).PrecisionScale(12, 2, true);
        RuleFor(o => o.foreign_currency_amount).GreaterThan(0).PrecisionScale(12, 2, true);
    }
}
