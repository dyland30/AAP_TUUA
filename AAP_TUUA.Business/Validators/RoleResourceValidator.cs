using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class RoleResourceValidator : AbstractValidator<RoleResource>
{
    public RoleResourceValidator()
    {
        RuleFor(r => r.role_id).NotNull().NotEmpty();
        RuleFor(r => r.resource_id).NotNull().NotEmpty();
    }
}