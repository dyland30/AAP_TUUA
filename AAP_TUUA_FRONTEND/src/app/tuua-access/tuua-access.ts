import { JsonPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { finalize } from 'rxjs';
import { TuuaPayload, TuuaResponse } from '../models';
import { TuuaAccessService } from '../services';
import { notBlank } from '../validators/not-blank.validator';

@Component({
  selector: 'app-tuua-access',
  imports: [
    JsonPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './tuua-access.html',
  styleUrls: ['../catalogs/catalog-crud.css', './tuua-access.css'],
})
export class TuuaAccess {
  private readonly fb = inject(FormBuilder);
  private readonly tuuaAccessService = inject(TuuaAccessService);

  protected readonly isSending = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly result = signal<TuuaResponse | null>(null);
  protected readonly lastPayload = signal<TuuaPayload | null>(null);

  protected readonly flightTypes = [
    { value: 'N', label: 'Nacional' },
    { value: 'I', label: 'Internacional' },
  ];

  protected readonly form = this.fb.nonNullable.group({
    boardingString: ['', [Validators.required, notBlank]],
    operationDate: this.fb.control<Date | null>(new Date(), Validators.required),
    tuuaGateCode: ['', [Validators.required, notBlank]],
    flightType: ['N', Validators.required],
  });

  protected submit(): void {
    if (this.isSending()) return;
    this.errorMessage.set(null);
    this.result.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: TuuaPayload = {
      boardingString: raw.boardingString.trim(),
      operationDate: raw.operationDate ? this.toApiDate(raw.operationDate) : null,
      tuuaGateCode: raw.tuuaGateCode.trim(),
      flightType: raw.flightType,
    };

    this.lastPayload.set(payload);
    this.isSending.set(true);
    this.tuuaAccessService
      .processTuuaAccess(payload)
      .pipe(finalize(() => this.isSending.set(false)))
      .subscribe({
        next: (response) => this.result.set(response),
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  protected reset(): void {
    this.form.reset({
      boardingString: '',
      operationDate: new Date(),
      tuuaGateCode: '',
      flightType: 'N',
    });
    this.errorMessage.set(null);
    this.result.set(null);
    this.lastPayload.set(null);
  }

  protected isOk(response: TuuaResponse): boolean {
    return response.response?.toLowerCase() === 'ok';
  }

  private toApiDate(value: Date): string {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private resolveError(error: HttpErrorResponse): string {
    if (error.status === 0) return 'No se pudo conectar con el servidor. Verifica tu conexión.';
    if (error.status === 401) return 'No autorizado. Inicia sesión nuevamente.';
    if (typeof error.error === 'string' && error.error.trim()) return error.error;
    return 'Ocurrió un error inesperado. Intenta nuevamente.';
  }
}
