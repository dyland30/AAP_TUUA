using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class TuuaTicketSaleRequestValidator : AbstractValidator<TuuaTicketSaleRequest>
{
    public TuuaTicketSaleRequestValidator()
    {
        RuleFor(r => r.cashier_machine_session_id).NotEmpty();
        RuleFor(r => r.document_type_id).NotEmpty();
        RuleFor(r => r.sale_type_id).NotEmpty();
        RuleFor(r => r.flight_type_id).NotEmpty();
        RuleFor(r => r.flight_id).NotEmpty();
        RuleFor(r => r.titular_passenger_name).NotEmpty().MaximumLength(100);
        RuleFor(r => r.passenger_email).MaximumLength(100).EmailAddress()
            .When(r => !string.IsNullOrWhiteSpace(r.passenger_email));
        RuleFor(r => r.ticket_quantity).GreaterThan(0).LessThanOrEqualTo(100);
        RuleFor(r => r.payment_type_id).NotEmpty();
        RuleFor(r => r.cash_amount_payed).GreaterThan(0).PrecisionScale(12, 2, true)
            .When(r => r.cash_amount_payed.HasValue);
    }
}
