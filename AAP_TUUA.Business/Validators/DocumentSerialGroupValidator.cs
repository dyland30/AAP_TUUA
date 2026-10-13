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

        RuleForEach(g => g.sequential_numbers).ChildRules(detail =>
        {
            detail.RuleFor(n => n.cashier_code).NotNull().NotEmpty().MaximumLength(20);
            detail.RuleFor(n => n.serial_number).NotNull().GreaterThanOrEqualTo(0);
            detail.RuleFor(n => n.max_sequential_number).NotNull().GreaterThanOrEqualTo(0);
        });

        // El serial final debe ser numérico, mayor o igual al inicial, y todo
        // número de serie del detalle debe caer dentro del rango [inicio, fin].
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

            if (group.sequential_numbers is null)
            {
                return;
            }

            foreach (var detail in group.sequential_numbers)
            {
                if (detail.serial_number is null)
                {
                    continue;
                }

                if (detail.serial_number.Value < start || detail.serial_number.Value > end)
                {
                    context.AddFailure(nameof(DocumentSerialGroup.sequential_numbers),
                        $"El número de serie {detail.serial_number.Value} está fuera del rango {start}-{end}.");
                }
            }
        });
    }
}
