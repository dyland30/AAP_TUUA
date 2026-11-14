using AAP_TUUA.Entidades;
using FluentValidation;
using System.Text.Json;

namespace AAP_TUUA.Business.Validators;

public class FlightImportRowValidator : AbstractValidator<FlightImportRow>
{
    public FlightImportRowValidator()
    {
        RuleFor(x => x.flight_import_batch_id).NotEmpty();
        RuleFor(x => x.row_number).GreaterThan(0);
        RuleFor(x => x.status_id).GreaterThan(0);
        RuleFor(x => x.airline_code).MaximumLength(5);
        RuleFor(x => x.flight_number).MaximumLength(10);
        RuleFor(x => x.flight_direction_code).MaximumLength(5);
        RuleFor(x => x.origin_airport_code).MaximumLength(5);
        RuleFor(x => x.destination_airport_code).MaximumLength(5);
        RuleFor(x => x.service_type_code).MaximumLength(5);
        RuleFor(x => x.aircraft_type_code).MaximumLength(4);
        RuleFor(x => x.days_of_week).MaximumLength(7);
        RuleFor(x => x.error_detail).MaximumLength(1000);
        RuleFor(x => x.raw_data).Must(IsValidJson).WithMessage("Raw data must contain valid JSON");
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
