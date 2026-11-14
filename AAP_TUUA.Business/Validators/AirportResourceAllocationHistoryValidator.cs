using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class AirportResourceAllocationHistoryValidator : AbstractValidator<AirportResourceAllocationHistory>
{
    public AirportResourceAllocationHistoryValidator()
    {
        RuleFor(x => x.airport_resource_allocation_id).NotEmpty();
        RuleFor(x => x.airport_resource_id).NotEmpty();
        RuleFor(x => x.action_id).GreaterThan(0);
        RuleFor(x => x.action_at).NotEmpty();
        RuleFor(x => x.action_by).MaximumLength(50);
        RuleFor(x => x.notes).MaximumLength(500);
    }
}
