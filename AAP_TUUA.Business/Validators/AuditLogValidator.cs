using AAP_TUUA.Entidades;
using FluentValidation;
using System.Text.Json;

namespace AAP_TUUA.Business.Validators;

public class AuditLogValidator : AbstractValidator<AuditLog>
{
    public AuditLogValidator()
    {
        RuleFor(x => x.action_id).GreaterThan(0);
        RuleFor(x => x.occurred_at).NotEmpty();
        RuleFor(x => x.username).MaximumLength(100);
        RuleFor(x => x.entity_name).MaximumLength(100);
        RuleFor(x => x.entity_id).MaximumLength(100);
        RuleFor(x => x.description).MaximumLength(1000);
        RuleFor(x => x.ip_address).MaximumLength(50);
        RuleFor(x => x.user_agent).MaximumLength(500);
        RuleFor(x => x.old_values).Must(IsValidJson).WithMessage("Old values must contain valid JSON");
        RuleFor(x => x.new_values).Must(IsValidJson).WithMessage("New values must contain valid JSON");
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
