using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class BoardingGateValidator : AbstractValidator<BoardingGate>
{
    public BoardingGateValidator()
    {
        RuleFor(b => b.resource_id).NotEmpty();
        RuleFor(b => b.boarding_type_id).NotEmpty();
    }
}
