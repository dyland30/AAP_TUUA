using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class FlightChangeHistoryValidator : AbstractValidator<FlightChangeHistory>
{
    public FlightChangeHistoryValidator()
    {
        RuleFor(x => x.flight_id).NotEmpty();
        RuleFor(x => x.field_name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.changed_at).NotEmpty();
        RuleFor(x => x.changed_by).MaximumLength(50);
    }
}
