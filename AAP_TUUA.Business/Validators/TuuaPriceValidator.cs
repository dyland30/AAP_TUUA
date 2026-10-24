using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class TuuaPriceValidator : AbstractValidator<TuuaPrice>
{
    public TuuaPriceValidator()
    {
        RuleFor(p => p.flight_type_id).NotEmpty();
        RuleFor(p => p.location_id).NotEmpty();
        RuleFor(p => p.terminal_id).NotEmpty();
        RuleFor(p => p.currency_id).NotEmpty();
        RuleFor(p => p.price).GreaterThanOrEqualTo(0).PrecisionScale(10, 2, true);
        RuleFor(p => p.date_start).NotEmpty();
        RuleFor(p => p.date_end)
            .GreaterThanOrEqualTo(p => p.date_start)
            .When(p => p.date_end.HasValue);
    }
}
