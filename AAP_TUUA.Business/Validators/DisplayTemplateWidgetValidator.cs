using AAP_TUUA.Entidades;
using FluentValidation;
using System.Text.Json;

namespace AAP_TUUA.Business.Validators;

public class DisplayTemplateWidgetValidator : AbstractValidator<DisplayTemplateWidget>
{
    public DisplayTemplateWidgetValidator()
    {
        RuleFor(x => x.display_template_version_id).NotEmpty();
        RuleFor(x => x.widget_type_id).GreaterThan(0);
        RuleFor(x => x.config).Must(IsValidJson).WithMessage("Config must contain valid JSON");
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
