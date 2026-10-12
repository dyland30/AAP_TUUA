using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class TuuaGateValidator : AbstractValidator<TuuaGate>
{
    public TuuaGateValidator()
    {
        RuleFor(g => g.terminal_id).NotEmpty();
        RuleFor(g => g.flight_type_id).NotEmpty();
        RuleFor(g => g.tuua_gate_type_id).NotEmpty();
        RuleFor(g => g.ipaddr).MaximumLength(50);
        RuleFor(g => g.description).MaximumLength(200);
    }
}
