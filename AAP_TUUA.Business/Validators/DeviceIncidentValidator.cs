using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class DeviceIncidentValidator : AbstractValidator<DeviceIncident>
{
    public DeviceIncidentValidator()
    {
        RuleFor(x => x.device_id).NotEmpty();
        RuleFor(x => x.incident_type_id).GreaterThan(0);
        RuleFor(x => x.detected_at).NotEmpty();
        RuleFor(x => x.acknowledged_by).MaximumLength(50);
        RuleFor(x => x.resolved_by).MaximumLength(50);
        RuleFor(x => x.notes).MaximumLength(1000);
    }
}
