import { NativeDateAdapter } from '@angular/material/core';

export const TUUA_DATE_FORMATS = {
  parse: {
    dateInput: 'dd/MM/yyyy',
    timeInput: 'HH:mm',
  },
  display: {
    dateInput: { day: '2-digit', month: '2-digit', year: 'numeric' },
    timeInput: { hour: 'numeric', minute: 'numeric' },
    monthYearLabel: { year: 'numeric', month: 'short' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' },
  },
};

export class TuuaDateAdapter extends NativeDateAdapter {
  override parse(value: unknown, parseFormat: unknown): Date | null {
    if (typeof value === 'string') {
      const text = value.trim();
      const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text);
      if (match) {
        const day = Number(match[1]);
        const month = Number(match[2]) - 1;
        const year = Number(match[3]);
        const date = new Date(year, month, day);
        const valid =
          date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
        return valid ? date : null;
      }
    }
    return super.parse(value, parseFormat);
  }
}
