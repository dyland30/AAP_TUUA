using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class FlightImportBatchValidator : AbstractValidator<FlightImportBatch>
{
    public FlightImportBatchValidator()
    {
        RuleFor(x => x.airport_id).NotEmpty();
        RuleFor(x => x.file_type_id).GreaterThan(0);
        RuleFor(x => x.status_id).GreaterThan(0);
        RuleFor(x => x.file_name).MaximumLength(255);
        RuleFor(x => x.storage_path).MaximumLength(500);
        RuleFor(x => x.confirmed_by).MaximumLength(50);
        RuleFor(x => x.error_report_path).MaximumLength(500);
        RuleFor(x => x.observation).MaximumLength(500);
    }
}
