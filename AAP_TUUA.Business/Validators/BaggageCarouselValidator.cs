using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class BaggageCarouselValidator : AbstractValidator<BaggageCarousel>
{
    public BaggageCarouselValidator()
    {
        RuleFor(b => b.resource_id).NotEmpty();
        RuleFor(b => b.terminal_id).NotEmpty();
        RuleFor(b => b.carousel_function_id).NotEmpty();
        RuleFor(b => b.belt_length_m).GreaterThan(0).When(b => b.belt_length_m.HasValue);
    }
}
