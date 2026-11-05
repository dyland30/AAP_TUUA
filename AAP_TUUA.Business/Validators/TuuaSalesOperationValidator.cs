using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class TuuaSalesOperationValidator : AbstractValidator<TuuaSalesOperation>
{
    public TuuaSalesOperationValidator()
    {
        RuleFor(o => o.cashier_machine_session_id).NotEmpty();
        RuleFor(o => o.operation_date).NotEmpty();
        RuleFor(o => o.document_type_id).NotEmpty();
        RuleFor(o => o.seae_type_id).NotEmpty();
        RuleFor(o => o.sale_type_id).NotEmpty();
        RuleFor(o => o.currency_id).NotEmpty();
        RuleFor(o => o.flight_number).MaximumLength(10);
        RuleFor(o => o.titular_passenger_name).MaximumLength(100);
        RuleFor(o => o.passenger_email).MaximumLength(100).EmailAddress()
            .When(o => !string.IsNullOrWhiteSpace(o.passenger_email));
        RuleFor(o => o.exchange_rate_id).NotEmpty();
        RuleFor(o => o.purchase_exchange_rate).GreaterThan(0).PrecisionScale(10, 3, true);
        RuleFor(o => o.sales_exchange_rate).GreaterThan(0).PrecisionScale(10, 3, true);
        RuleFor(o => o.payment_type_id).NotEmpty();
        RuleFor(o => o.status_id).NotEmpty();
        RuleFor(o => o.ticket_quantity).GreaterThan(0);
        RuleFor(o => o.unit_price).GreaterThanOrEqualTo(0).PrecisionScale(12, 2, true);
        RuleFor(o => o.tuua_price_id).NotEmpty();
        RuleFor(o => o.subtotal).GreaterThanOrEqualTo(0).PrecisionScale(12, 2, true);
        RuleFor(o => o.total).GreaterThanOrEqualTo(0).PrecisionScale(12, 2, true);
        RuleFor(o => o.igv_tax_amount).GreaterThanOrEqualTo(0).PrecisionScale(12, 2, true);
        RuleFor(o => o.cash_amount_payed).GreaterThanOrEqualTo(0).PrecisionScale(12, 2, true)
            .When(o => o.cash_amount_payed.HasValue);
        RuleFor(o => o.cash_change).GreaterThanOrEqualTo(0).PrecisionScale(12, 2, true)
            .When(o => o.cash_change.HasValue);
        RuleFor(o => o.payment_id).MaximumLength(100);
        RuleFor(o => o.payment_authorization).MaximumLength(100);
        RuleFor(o => o.payment_card_brand).MaximumLength(50);
        RuleFor(o => o.payment_holder_name).MaximumLength(100);
        RuleFor(o => o.payment_status).MaximumLength(50);
        RuleFor(o => o.payment_amount).PrecisionScale(10, 2, true)
            .When(o => o.payment_amount.HasValue);
        RuleFor(o => o.payment_currency).MaximumLength(10);
        RuleForEach(o => o.tickets).SetValidator(new TuuaTicketValidator());
    }
}
