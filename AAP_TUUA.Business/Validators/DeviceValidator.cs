using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class DeviceValidator : AbstractValidator<Device>
{
    public DeviceValidator()
    {
        RuleFor(x => x.airport_id).NotEmpty();
        RuleFor(x => x.code).NotEmpty().MaximumLength(50);
        RuleFor(x => x.name).MaximumLength(100);
        RuleFor(x => x.location_description).MaximumLength(200);
        RuleFor(x => x.ip_address).MaximumLength(50);
        RuleFor(x => x.mac_address).MaximumLength(17);
        RuleFor(x => x.hostname).MaximumLength(100);
        RuleFor(x => x.display_type_id).GreaterThan(0);
        RuleFor(x => x.orientation_id).GreaterThan(0);
        RuleFor(x => x.resolution_id).GreaterThan(0);
        RuleFor(x => x.status_id).GreaterThan(0);
        RuleFor(x => x.video_wall_position).NotNull().When(x => x.video_wall_id.HasValue);
        RuleFor(x => x.software_version).MaximumLength(50);
        RuleFor(x => x.config_version).MaximumLength(50);
        RuleFor(x => x.os_version).MaximumLength(100);
        RuleFor(x => x.serial_number).MaximumLength(100);
        RuleFor(x => x.manufacturer).MaximumLength(100);
        RuleFor(x => x.model).MaximumLength(100);
        RuleFor(x => x.remote_credential_ref).MaximumLength(200);
    }
}
