using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class DocumentSequentialNumberValidator : AbstractValidator<DocumentSequentialNumber>
{
    public DocumentSequentialNumberValidator()
    {
        RuleFor(n => n.document_serial_group_id).NotEmpty();
        RuleFor(n => n.cashier_code).NotNull().NotEmpty().MaximumLength(20);
        RuleFor(n => n.serial_number).NotNull().GreaterThanOrEqualTo(0);
        RuleFor(n => n.max_sequential_number).NotNull().GreaterThanOrEqualTo(0);
    }
}
