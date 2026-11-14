using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class OperationalAlertValidator : AbstractValidator<OperationalAlert>
{
    public OperationalAlertValidator()
    {
        RuleFor(x => x.airport_id).NotEmpty();
        RuleFor(x => x.flight_id).NotEmpty();
        RuleFor(x => x.alert_type_id).GreaterThan(0);
        RuleFor(x => x.detected_at).NotEmpty();
        RuleFor(x => x.threshold_value).MaximumLength(50);
        RuleFor(x => x.old_value).MaximumLength(200);
        RuleFor(x => x.new_value).MaximumLength(200);
        RuleFor(x => x.notified_to).MaximumLength(500);
        RuleFor(x => x.acknowledged_by).MaximumLength(50);
    }
}
