using AAP_TUUA.Entidades;
using FluentValidation;
using System.Text.Json;

namespace AAP_TUUA.Business.Validators;

public class EmergencyMessageTemplateValidator : AbstractValidator<EmergencyMessageTemplate>
{
    public EmergencyMessageTemplateValidator()
    {
        RuleFor(x => x.alert_type_id).GreaterThan(0);
        RuleFor(x => x.language_id).GreaterThan(0);
        RuleFor(x => x.title).NotEmpty().MaximumLength(100);
        RuleFor(x => x.subtitle).MaximumLength(200);
        RuleFor(x => x.ticker_text).MaximumLength(1000);
        RuleFor(x => x.instructions).Must(IsValidJson).WithMessage("Instructions must contain valid JSON");
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
