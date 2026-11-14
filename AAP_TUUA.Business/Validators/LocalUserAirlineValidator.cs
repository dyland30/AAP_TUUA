using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class LocalUserAirlineValidator : AbstractValidator<LocalUserAirline>
{
    public LocalUserAirlineValidator()
    {
        RuleFor(x => x.local_user_id).NotEmpty();
        RuleFor(x => x.airline_id).NotEmpty();
    }
}
