using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class BehaviorGroupTemplateValidator : AbstractValidator<BehaviorGroupTemplate>
{
    public BehaviorGroupTemplateValidator()
    {
        RuleFor(x => x.behavior_group_id).NotEmpty();
        RuleFor(x => x.display_template_id).NotEmpty();
    }
}
