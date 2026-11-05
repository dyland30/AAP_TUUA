using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class TuuaTicketValidator : AbstractValidator<TuuaTicket>
{
    public TuuaTicketValidator()
    {
        RuleFor(t => t.document_sequential_numbers_id).NotEmpty();
        RuleFor(t => t.tuua_gate_code).MaximumLength(20);
        RuleFor(t => t.serial).NotNull().NotEmpty().MaximumLength(10);
        RuleFor(t => t.sequential_number).GreaterThanOrEqualTo(0);
        RuleFor(t => t.hash_ticket).NotNull().NotEmpty().MaximumLength(100);
        RuleFor(t => t.status_id).NotEmpty();
        RuleFor(t => t.price).GreaterThanOrEqualTo(0).PrecisionScale(12, 2, true);
        RuleFor(t => t.subtotal).GreaterThanOrEqualTo(0).PrecisionScale(12, 2, true);
        RuleFor(t => t.total).GreaterThanOrEqualTo(0).PrecisionScale(12, 2, true);
        RuleFor(t => t.igv_tax_amount).GreaterThanOrEqualTo(0).PrecisionScale(12, 2, true);
    }
}
