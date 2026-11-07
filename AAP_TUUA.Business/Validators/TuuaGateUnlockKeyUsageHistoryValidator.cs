using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class TuuaGateUnlockKeyUsageHistoryValidator : AbstractValidator<TuuaGateUnlockKeyUsageHistory>
{
    public TuuaGateUnlockKeyUsageHistoryValidator()
    {
        RuleFor(h => h.tuua_gate_unlock_keys_id).NotEmpty();
        RuleFor(h => h.usage_date).NotEmpty();
        RuleFor(h => h.tuua_gate_code).NotNull().NotEmpty().MaximumLength(20);
    }
}
