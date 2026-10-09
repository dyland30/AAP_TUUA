import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { finalize } from 'rxjs';
import { Airline } from '../models';
import { AirlineService } from '../services/airline.service';

type FormMode = 'list' | 'create' | 'edit';

@Component({
  selector: 'app-airlines',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './airlines.html',
  styleUrl: './airlines.css',
})
export class Airlines implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly airlineService = inject(AirlineService);

  protected readonly airlines = signal<Airline[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly mode = signal<FormMode>('list');
  protected readonly editingId = signal<string | null>(null);
  protected readonly deleteTarget = signal<Airline | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    company_name: ['', [Validators.required, Validators.maxLength(100)]],
    ruc: ['', [Validators.maxLength(30)]],
    cod_sap: ['', [Validators.maxLength(100)]],
    oaci_code: ['', [Validators.maxLength(5)]],
    iata_code: ['', [Validators.maxLength(5)]],
    is_active: [true],
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.airlineService
      .getAll()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (airlines) => this.airlines.set(airlines ?? []),
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  protected startCreate(): void {
    this.clearMessages();
    this.editingId.set(null);
    this.resetForm();
    this.mode.set('create');
  }

  protected startEdit(airline: Airline): void {
    this.clearMessages();
    this.editingId.set(airline.id);
    this.form.reset({
      company_name: airline.company_name ?? '',
      ruc: airline.ruc ?? '',
      cod_sap: airline.cod_sap ?? '',
      oaci_code: airline.oaci_code ?? '',
      iata_code: airline.iata_code ?? '',
      is_active: airline.is_active ?? true,
    });
    this.mode.set('edit');
  }

  protected cancelForm(): void {
    this.mode.set('list');
    this.editingId.set(null);
    this.resetForm();
  }

  protected submit(): void {
    if (this.isSaving()) {
      return;
    }

    this.clearMessages();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const isCreate = this.mode() === 'create';
    const payload = this.buildPayload();

    this.isSaving.set(true);
    const request$ = isCreate
      ? this.airlineService.add(payload)
      : this.airlineService.update(payload);

    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.mode.set('list');
        this.editingId.set(null);
        this.resetForm();
        this.successMessage.set(
          isCreate ? 'Aerolínea creada correctamente.' : 'Aerolínea actualizada correctamente.',
        );
        this.load();
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  protected askDelete(airline: Airline): void {
    this.clearMessages();
    this.deleteTarget.set(airline);
  }

  protected cancelDelete(): void {
    this.deleteTarget.set(null);
  }

  protected confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target?.id || this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    this.airlineService
      .delete(target.id)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.deleteTarget.set(null);
          this.successMessage.set('Aerolínea eliminada correctamente.');
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          this.deleteTarget.set(null);
          this.errorMessage.set(this.resolveError(error));
        },
      });
  }

  private buildPayload(): Airline {
    const raw = this.form.getRawValue();
    return {
      id: this.editingId(),
      company_name: raw.company_name,
      ruc: raw.ruc || null,
      cod_sap: raw.cod_sap || null,
      oaci_code: raw.oaci_code || null,
      iata_code: raw.iata_code || null,
      is_active: raw.is_active,
      created_at: null,
      updated_at: null,
      created_by: null,
      modified_by: null,
    };
  }

  private resetForm(): void {
    this.form.reset({
      company_name: '',
      ruc: '',
      cod_sap: '',
      oaci_code: '',
      iata_code: '',
      is_active: true,
    });
  }

  private clearMessages(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  private resolveError(error: HttpErrorResponse): string {
    if (typeof error.error === 'string' && error.error.trim().length > 0) {
      return error.error;
    }
    if (error.status === 0) {
      return 'No se pudo conectar con el servidor. Verifica tu conexión.';
    }
    return 'Ocurrió un error inesperado. Intenta nuevamente.';
  }
}
