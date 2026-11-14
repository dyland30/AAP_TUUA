using AAP_TUUA.Entidades;
using FluentValidation;
using System.Text.Json;

namespace AAP_TUUA.Business.Validators;

public class SystemEventLogValidator : AbstractValidator<SystemEventLog>
{
    public SystemEventLogValidator()
    {
        RuleFor(x => x.level_id).GreaterThan(0);
        RuleFor(x => x.component_id).GreaterThan(0);
        RuleFor(x => x.message).NotEmpty().MaximumLength(2000);
        RuleFor(x => x.occurred_at).NotEmpty();
        RuleFor(x => x.correlation_id).MaximumLength(100);
        RuleFor(x => x.host_name).MaximumLength(100);
        RuleFor(x => x.details).Must(IsValidJson).WithMessage("Details must contain valid JSON");
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
