using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class EmergencyAlertDisplayRuleValidator : AbstractValidator<EmergencyAlertDisplayRule>
{
    public EmergencyAlertDisplayRuleValidator()
    {
        RuleFor(x => x.alert_type_id).GreaterThan(0);
        RuleFor(x => x.display_type_id).GreaterThan(0);
    }
}
