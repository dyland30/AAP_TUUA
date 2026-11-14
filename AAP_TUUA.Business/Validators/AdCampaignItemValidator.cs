using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class AdCampaignItemValidator : AbstractValidator<AdCampaignItem>
{
    public AdCampaignItemValidator()
    {
        RuleFor(x => x.ad_campaign_id).NotEmpty();
        RuleFor(x => x.media_asset_id).NotEmpty();
    }
}
