using AAP_TUUA.Entidades;
using FluentValidation;
using System.Text.Json;

namespace AAP_TUUA.Business.Validators;

public class DisplayTemplateFieldValidator : AbstractValidator<DisplayTemplateField>
{
    public DisplayTemplateFieldValidator()
    {
        RuleFor(x => x.display_template_version_id).NotEmpty();
        RuleFor(x => x.field_id).GreaterThan(0);
        RuleFor(x => x.text_align).MaximumLength(10);
        RuleFor(x => x.format_mask).MaximumLength(50);
        RuleFor(x => x.properties).Must(IsValidJson).WithMessage("Properties must contain valid JSON");
    }

    private static bool IsValidJson(string? value)
    {
        if (value is null)
        {
            return true;
        }

        try
        {
            using var document = JsonDocument.Parse(value);
            return true;
        }
        catch (JsonException) { return false; }
    }
}
