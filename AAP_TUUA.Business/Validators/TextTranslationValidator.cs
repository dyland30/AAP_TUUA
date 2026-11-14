using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class TextTranslationValidator : AbstractValidator<TextTranslation>
{
    public TextTranslationValidator()
    {
        RuleFor(x => x.text_key).NotEmpty().MaximumLength(100);
        RuleFor(x => x.language_id).GreaterThan(0);
        RuleFor(x => x.text_value).NotEmpty().MaximumLength(2000);
        RuleFor(x => x.context).MaximumLength(100);
    }
}
