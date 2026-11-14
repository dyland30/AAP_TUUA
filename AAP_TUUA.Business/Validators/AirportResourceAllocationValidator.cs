using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class AirportResourceAllocationValidator : AbstractValidator<AirportResourceAllocation>
{
    public AirportResourceAllocationValidator()
    {
        RuleFor(a => a.airport_resource_id).NotEmpty();
        RuleFor(a => a.star_time).NotEmpty();
        RuleFor(a => a.status_id).NotEmpty();
        RuleFor(a => a.end_time)
            .GreaterThanOrEqualTo(a => a.star_time)
            .When(a => a.end_time.HasValue);
        RuleFor(a => a.actual_end_time)
            .GreaterThanOrEqualTo(a => a.actual_start_time)
            .When(a => a.actual_end_time.HasValue && a.actual_start_time.HasValue);
        RuleFor(a => a.display_order)
            .GreaterThanOrEqualTo((short)0)
            .When(a => a.display_order.HasValue);
    }
}
