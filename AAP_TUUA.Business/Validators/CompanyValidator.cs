using AAP_TUUA.Entidades;
using FluentValidation;

namespace AAP_TUUA.Business.Validators;

public class CompanyValidator : AbstractValidator<Company>
{
    public CompanyValidator()
    {
        RuleFor(c => c.company_name).NotEmpty().MaximumLength(200);
        RuleFor(c => c.business_name).NotEmpty().MaximumLength(200);
        RuleFor(c => c.document_number).MaximumLength(20);
        RuleFor(c => c.address).MaximumLength(200);
    }
}
