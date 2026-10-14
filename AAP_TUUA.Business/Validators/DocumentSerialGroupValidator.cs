using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class DocumentSerialGroupValidator : AbstractValidator<DocumentSerialGroup>
{
    public DocumentSerialGroupValidator()
    {
        RuleFor(g => g.document_type_id).NotEmpty();
        RuleFor(g => g.seae_type_id).NotEmpty();
        RuleFor(g => g.sale_type_id).NotEmpty();
        RuleFor(g => g.serial_prefix).NotNull().NotEmpty().MaximumLength(2);
        RuleFor(g => g.serial_start).NotNull().GreaterThanOrEqualTo(0);
        RuleFor(g => g.serial_end).NotNull().NotEmpty().MaximumLength(5);

        // El serial final debe ser numérico y mayor o igual al inicial.
        RuleFor(g => g).Custom((group, context) =>
        {
            if (group.serial_start is null)
            {
                return;
            }

            var start = group.serial_start.Value;

            if (!int.TryParse((group.serial_end ?? string.Empty).Trim(), out var end))
            {
                context.AddFailure(nameof(DocumentSerialGroup.serial_end), "El serial final debe ser numérico.");
                return;
            }

            if (end < start)
            {
                context.AddFailure(nameof(DocumentSerialGroup.serial_end),
                    "El serial final debe ser mayor o igual al serial inicial.");
            }
        });
    }
}
