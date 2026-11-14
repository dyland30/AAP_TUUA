using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class AdCampaignBehaviorGroupValidator : AbstractValidator<AdCampaignBehaviorGroup>
{
    public AdCampaignBehaviorGroupValidator()
    {
        RuleFor(x => x.ad_campaign_id).NotEmpty();
        RuleFor(x => x.behavior_group_id).NotEmpty();
    }
}
