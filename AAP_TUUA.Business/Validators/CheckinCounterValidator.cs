using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class CheckinCounterValidator : AbstractValidator<CheckinCounter>
{
    public CheckinCounterValidator()
    {
        RuleFor(c => c.resource_id).NotEmpty();
        RuleFor(c => c.terminal_id).NotEmpty();
        RuleFor(c => c.island).NotEmpty().MaximumLength(10);
        RuleFor(c => c.counter_type_id).NotEmpty();
    }
}
