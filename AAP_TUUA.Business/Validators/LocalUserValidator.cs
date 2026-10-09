using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class LocalUserValidator : AbstractValidator<LocalUser>
{
    public LocalUserValidator()
    {
        RuleFor(u => u.name).NotNull().NotEmpty();
        RuleFor(u => u.email).NotNull().NotEmpty().EmailAddress();
    }
}
