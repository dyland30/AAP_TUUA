using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class LocalUserAirportValidator : AbstractValidator<LocalUserAirport>
{
    public LocalUserAirportValidator()
    {
        RuleFor(x => x.local_user_id).NotEmpty();
        RuleFor(x => x.airport_id).NotEmpty();
    }
}
