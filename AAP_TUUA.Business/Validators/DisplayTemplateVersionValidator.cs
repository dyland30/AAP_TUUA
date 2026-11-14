using AAP_TUUA.Entidades;
using FluentValidation;
using System.Text.Json;

namespace AAP_TUUA.Business.Validators;

public class DisplayTemplateVersionValidator : AbstractValidator<DisplayTemplateVersion>
{
    public DisplayTemplateVersionValidator()
    {
        RuleFor(x => x.display_template_id).NotEmpty();
        RuleFor(x => x.version_number).GreaterThan(0);
        RuleFor(x => x.published_by).MaximumLength(50);
        RuleFor(x => x.change_notes).MaximumLength(500);
        RuleFor(x => x.layout).Must(IsValidJson).WithMessage("Layout must contain valid JSON");
        RuleFor(x => x.styles).Must(IsValidJson).WithMessage("Styles must contain valid JSON");
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
