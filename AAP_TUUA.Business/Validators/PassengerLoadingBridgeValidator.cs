using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class PassengerLoadingBridgeValidator : AbstractValidator<PassengerLoadingBridge>
{
    public PassengerLoadingBridgeValidator()
    {
        RuleFor(b => b.resource_id).NotEmpty();
        RuleFor(b => b.boarding_gate_id).NotEmpty();
        RuleFor(b => b.stand_id).NotEmpty();
        RuleFor(b => b.bridge_type_id).NotEmpty();
        RuleFor(b => b.max_aircraft_size_id).NotEmpty();
        RuleFor(b => b.door_position).MaximumLength(4);
        RuleFor(b => b.min_sill_height_m).GreaterThanOrEqualTo(0).When(b => b.min_sill_height_m.HasValue);
        RuleFor(b => b.max_sill_height_m).GreaterThanOrEqualTo(0).When(b => b.max_sill_height_m.HasValue);
        RuleFor(b => b.max_sill_height_m)
            .GreaterThanOrEqualTo(b => b.min_sill_height_m!.Value)
            .When(b => b.min_sill_height_m.HasValue && b.max_sill_height_m.HasValue);
    }
}
