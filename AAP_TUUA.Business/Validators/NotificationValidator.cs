using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class NotificationValidator : AbstractValidator<Notification>
{
    public NotificationValidator()
    {
        RuleFor(x => x.channel_id).GreaterThan(0);
        RuleFor(x => x.recipient_address).NotEmpty().MaximumLength(200);
        RuleFor(x => x.subject).MaximumLength(300);
        RuleFor(x => x.status_id).GreaterThan(0);
        RuleFor(x => x.error_message).MaximumLength(1000);
    }
}
