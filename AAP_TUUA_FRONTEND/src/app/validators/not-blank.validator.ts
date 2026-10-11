import { AbstractControl, ValidationErrors } from '@angular/forms';

// Un valor compuesto solo por espacios cuenta como vacío.
export function notBlank(control: AbstractControl<string | null>): ValidationErrors | null {
  return control.value && !control.value.trim() ? { required: true } : null;
}
