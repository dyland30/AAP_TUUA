using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class VideoWallValidator : AbstractValidator<VideoWall>
{
    public VideoWallValidator()
    {
        RuleFor(x => x.airport_id).NotEmpty();
        RuleFor(x => x.code).NotEmpty().MaximumLength(30);
        RuleFor(x => x.name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.grid_rows).GreaterThan((short)0);
        RuleFor(x => x.grid_columns).GreaterThan((short)0);
    }
}
