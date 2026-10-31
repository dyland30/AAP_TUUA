using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class TurnaroundValidator : AbstractValidator<Turnaround>
{
    public TurnaroundValidator()
    {
        RuleFor(t => t.min_ground_time).GreaterThan(0).When(t => t.min_ground_time.HasValue);
    }
}
