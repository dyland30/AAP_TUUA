using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class BoardingpassDaeSeaeValidator : AbstractValidator<BoardingpassDaeSeae>
{
    public BoardingpassDaeSeaeValidator()
    {
        RuleFor(b => b.tuua_gate_code).NotNull().NotEmpty().MaximumLength(20);
        RuleFor(b => b.flight_type_id).NotEmpty();
        RuleFor(b => b.airline_id).NotEmpty();
        RuleFor(b => b.flight_number).NotNull().NotEmpty().MaximumLength(10);
        RuleFor(b => b.flight_date).NotEmpty();
        RuleFor(b => b.passenger_name).NotNull().NotEmpty().MaximumLength(30);
        RuleFor(b => b.seat_number).MaximumLength(10);
        RuleFor(b => b.pnr).MaximumLength(20);
        RuleFor(b => b.passenger_status).NotNull().NotEmpty().MaximumLength(2);
        RuleFor(b => b.str_bcbp).MaximumLength(200);
    }
}
