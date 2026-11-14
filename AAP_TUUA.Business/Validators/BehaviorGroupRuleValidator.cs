using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class BehaviorGroupRuleValidator : AbstractValidator<BehaviorGroupRule>
{
    public BehaviorGroupRuleValidator()
    {
        RuleFor(x => x.behavior_group_id).NotEmpty();
        RuleFor(x => x.rule_type_id).GreaterThan(0);
        RuleFor(x => x.rule_value).MaximumLength(1000);
    }
}
