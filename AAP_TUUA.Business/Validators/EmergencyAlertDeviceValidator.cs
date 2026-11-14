using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class EmergencyAlertDeviceValidator : AbstractValidator<EmergencyAlertDevice>
{
    public EmergencyAlertDeviceValidator()
    {
        RuleFor(x => x.emergency_alert_id).NotEmpty();
        RuleFor(x => x.device_id).NotEmpty();
        RuleFor(x => x.status_id).GreaterThan(0);
        RuleFor(x => x.error_message).MaximumLength(1000);
    }
}
