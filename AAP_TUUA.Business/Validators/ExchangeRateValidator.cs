using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class ExchangeRateValidator : AbstractValidator<ExchangeRate>
{
    public ExchangeRateValidator()
    {
        RuleFor(e => e.day).NotEmpty();
        RuleFor(e => e.base_currency_id).NotEmpty();
        RuleFor(e => e.target_currency_id).NotEmpty()
            .Must((e, target) => target != e.base_currency_id)
            .WithMessage("Base and target currency must be different");
        RuleFor(e => e.purchase_exchange_rate).GreaterThan(0).PrecisionScale(10, 3, true);
        RuleFor(e => e.sales_exchange_rate).GreaterThan(0).PrecisionScale(10, 3, true);
    }
}
