using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class EmergencyAlertSectorValidator : AbstractValidator<EmergencyAlertSector>
{
    public EmergencyAlertSectorValidator()
    {
        RuleFor(x => x.emergency_alert_id).NotEmpty();
        RuleFor(x => x.airport_sector_id).NotEmpty();
    }
}
