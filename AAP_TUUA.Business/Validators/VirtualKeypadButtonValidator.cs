using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class VirtualKeypadButtonValidator : AbstractValidator<VirtualKeypadButton>
{
    public VirtualKeypadButtonValidator()
    {
        RuleFor(x => x.target_status_id).GreaterThan(0);
        RuleFor(x => x.label_es).NotEmpty().MaximumLength(50);
        RuleFor(x => x.label_en).MaximumLength(50);
        RuleFor(x => x.color).MaximumLength(9);
    }
}
