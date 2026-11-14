using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class BehaviorGroupValidator : AbstractValidator<BehaviorGroup>
{
    public BehaviorGroupValidator()
    {
        RuleFor(x => x.code).NotEmpty().MaximumLength(30);
        RuleFor(x => x.name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.description).MaximumLength(500);
        RuleFor(x => x.content_type_id).GreaterThan(0);
        RuleFor(x => x.standard_number).InclusiveBetween((short)1, (short)12).When(x => x.standard_number.HasValue);
    }
}
