using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class ResourceOutageValidator : AbstractValidator<ResourceOutage>
{
    public ResourceOutageValidator()
    {
        RuleFor(o => o.resource_id).NotEmpty();
        RuleFor(o => o.reason).NotEmpty();
        RuleFor(o => o.end_date)
            .GreaterThanOrEqualTo(o => o.start_date!.Value)
            .When(o => o.start_date.HasValue && o.end_date.HasValue);
    }
}
