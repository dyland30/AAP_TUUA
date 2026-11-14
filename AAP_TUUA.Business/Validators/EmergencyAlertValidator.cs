using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class EmergencyAlertValidator : AbstractValidator<EmergencyAlert>
{
    public EmergencyAlertValidator()
    {
        RuleFor(x => x.airport_id).NotEmpty();
        RuleFor(x => x.alert_type_id).GreaterThan(0);
        RuleFor(x => x.origin_id).GreaterThan(0);
        RuleFor(x => x.coverage_id).GreaterThan(0);
        RuleFor(x => x.status_id).GreaterThan(0);
        RuleFor(x => x.requested_at).NotEmpty();
        RuleFor(x => x.custom_message_es).MaximumLength(1000);
        RuleFor(x => x.custom_message_en).MaximumLength(1000);
        RuleFor(x => x.requested_by).MaximumLength(50);
        RuleFor(x => x.confirmed_by).MaximumLength(50);
        RuleFor(x => x.ended_by).MaximumLength(50);
        RuleFor(x => x.observation).MaximumLength(1000);
        RuleFor(x => x.ended_at).Must((x, end) => !end.HasValue || !x.started_at.HasValue || end >= x.started_at)
            .WithMessage("End time must be on or after start time");
    }
}
