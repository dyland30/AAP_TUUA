using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class NotificationRecipientValidator : AbstractValidator<NotificationRecipient>
{
    public NotificationRecipientValidator()
    {
        RuleFor(x => x.event_type_id).GreaterThan(0);
        RuleFor(x => x.channel_id).GreaterThan(0);
        RuleFor(x => x.recipient_address).NotEmpty().MaximumLength(200);
    }
}
