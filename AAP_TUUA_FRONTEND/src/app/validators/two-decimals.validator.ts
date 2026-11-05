import { AbstractControl, ValidationErrors } from '@angular/forms';

// Los montos se guardan con 2 decimales (cash_flow.amount es decimal(18,2)).
export function twoDecimals(control: AbstractControl<number | null>): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === undefined) return null;
  return Math.abs(value * 100 - Math.round(value * 100)) < 1e-6 ? null : { scale: true };
}
