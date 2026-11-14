using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class MediaAssetValidator : AbstractValidator<MediaAsset>
{
    public MediaAssetValidator()
    {
        RuleFor(x => x.media_type_id).GreaterThan(0);
        RuleFor(x => x.name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.storage_path).MaximumLength(500);
        RuleFor(x => x.text_content).MaximumLength(2000);
        RuleFor(x => x.mime_type).MaximumLength(100);
        RuleFor(x => x.checksum_sha256).MaximumLength(64);
    }
}
