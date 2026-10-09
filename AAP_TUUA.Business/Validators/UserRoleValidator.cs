using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class UserRoleValidator : AbstractValidator<UserRole>
{
    public UserRoleValidator()
    {
        RuleFor(ur => ur.user_id).NotNull().NotEmpty();
        RuleFor(ur => ur.role_id).NotNull().NotEmpty();
    }
}
