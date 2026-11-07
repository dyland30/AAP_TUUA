using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class TuuaGateUnlockKeyValidator : AbstractValidator<TuuaGateUnlockKey>
{
    public TuuaGateUnlockKeyValidator()
    {
        RuleFor(k => k.user_id).NotEmpty();
        RuleFor(k => k.type_id).NotEmpty();
    }
}
