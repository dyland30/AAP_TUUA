using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class FlightValidator : AbstractValidator<Flight>
{
    public FlightValidator()
    {
        RuleFor(f => f.airport_id).NotEmpty();
        RuleFor(f => f.terminal_id).NotEmpty();
        RuleFor(f => f.location_id).NotEmpty();
        RuleFor(f => f.other_airport_id).NotEmpty();
        RuleFor(f => f.origin_airport_code).NotNull().NotEmpty().MaximumLength(5);
        RuleFor(f => f.destination_airprt_code).NotNull().NotEmpty().MaximumLength(5);
        RuleFor(f => f.flight_direction_id).NotEmpty();
        RuleFor(f => f.service_type_id).NotEmpty();
        RuleFor(f => f.status_id).NotEmpty();
        RuleFor(f => f.public_iata_code).MaximumLength(5);
        RuleFor(f => f.operational_iata_code).MaximumLength(5);
        RuleFor(f => f.flight_number).MaximumLength(5);
        RuleFor(f => f.flight_identity).MaximumLength(10);
        RuleFor(f => f.schedule_date).NotEmpty();
        RuleFor(f => f.scheduled_time).NotEmpty();
    }
}
