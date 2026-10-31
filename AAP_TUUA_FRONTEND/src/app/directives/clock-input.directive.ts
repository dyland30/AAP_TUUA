import { DestroyRef, Directive, ElementRef, inject } from '@angular/core';

/**
 * Máscara para campos de hora HH:mm (24 h).
 * - Solo admite dígitos y descarta los que producirían una hora o minuto inválido.
 * - Inserta automáticamente ":" tras la hora y antepone "0" cuando el primer dígito es 3-9 (5 -> "05:").
 * - Permite borrar con retroceso sin que el ":" se vuelva a insertar.
 *
 * El listener se registra en fase de captura para que el valor ya esté formateado
 * cuando el DefaultValueAccessor lo lea y lo propague al formulario.
 */
@Directive({
  selector: 'input[appClockInput]',
  host: {
    inputmode: 'numeric',
    maxlength: '5',
    autocomplete: 'off',
  },
})
export class ClockInputDirective {
  private readonly input = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;

  constructor() {
    const handler = (event: Event) => this.onInput(event as InputEvent);
    this.input.addEventListener('input', handler, true);
    inject(DestroyRef).onDestroy(() => this.input.removeEventListener('input', handler, true));
  }

  private onInput(event: InputEvent): void {
    const el = this.input;
    const raw = el.value;
    const caret = el.selectionStart ?? raw.length;
    const atEnd = caret >= raw.length;
    const digitsBeforeCaret = raw.slice(0, caret).replace(/\D/g, '').length;
    const deleting = typeof event.inputType === 'string' && event.inputType.startsWith('delete');

    const digits = ClockInputDirective.validDigits(raw);
    const formatted = ClockInputDirective.format(digits, deleting);

    if (formatted === raw) return;
    el.value = formatted;

    if (atEnd) {
      el.setSelectionRange(formatted.length, formatted.length);
      return;
    }
    // Restaura el cursor según la cantidad de dígitos que quedaron antes de él.
    let seen = 0;
    let pos = 0;
    while (pos < formatted.length && seen < Math.min(digitsBeforeCaret, digits.length)) {
      if (formatted[pos] !== ':') seen++;
      pos++;
    }
    el.setSelectionRange(pos, pos);
  }

  /** Filtra los dígitos tecleados dejando solo la secuencia que forma una hora válida. */
  private static validDigits(raw: string): string {
    const out: string[] = [];
    for (const ch of raw.replace(/\D/g, '')) {
      if (out.length >= 4) break;
      if (out.length === 0) {
        if (ch > '2') out.push('0', ch); // 5 -> 05
        else out.push(ch);
      } else if (out.length === 1) {
        if (out[0] === '2' && ch > '3') continue; // 24-29 no existen
        out.push(ch);
      } else if (out.length === 2) {
        if (ch > '5') continue; // minutos 60-99 no existen
        out.push(ch);
      } else {
        out.push(ch);
      }
    }
    return out.join('');
  }

  private static format(digits: string, deleting: boolean): string {
    if (digits.length < 2) return digits;
    if (digits.length === 2) return deleting ? digits : `${digits}:`;
    return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  }
}
