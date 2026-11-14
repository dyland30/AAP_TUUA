import { AbstractControl, ValidationErrors } from '@angular/forms';

// Un campo jsonb vacío es válido; si tiene contenido debe ser JSON bien formado.
export function jsonText(control: AbstractControl<string | null>): ValidationErrors | null {
  const value = control.value?.trim();
  if (!value) return null;
  try {
    JSON.parse(value);
    return null;
  } catch {
    return { json: true };
  }
}
