using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class AdCampaignValidator : AbstractValidator<AdCampaign>
{
    public AdCampaignValidator()
    {
        RuleFor(x => x.airport_id).NotEmpty();
        RuleFor(x => x.name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.description).MaximumLength(500);
        RuleFor(x => x.start_date).NotEmpty();
        RuleFor(x => x.end_date).NotEmpty().Must((x, end) => end.Date >= x.start_date.Date)
            .WithMessage("End date must be on or after start date");
        RuleFor(x => x.priority_id).GreaterThan(0);
        RuleFor(x => x.status_id).GreaterThan(0);
    }
}
