import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { CashierMachine, DocumentSequentialNumber, DocumentSerialGroup } from '../models';
import { CashierMachineService, DocumentSequentialNumberService, DocumentSerialGroupService } from '../services';

@Component({
  selector: 'app-document-sequential-numbers',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './document-sequential-numbers.html',
  styleUrl: '../catalogs/catalog-crud.css',
})
export class DocumentSequentialNumbers implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly numberService = inject(DocumentSequentialNumberService);
  private readonly groupService = inject(DocumentSerialGroupService);
  private readonly cashierMachineService = inject(CashierMachineService);

  protected readonly groupId = this.route.snapshot.paramMap.get('groupId') ?? '';
  protected readonly group = signal<DocumentSerialGroup | null>(null);
  protected readonly numbers = signal<DocumentSequentialNumber[]>([]);
  protected readonly cashierMachines = signal<CashierMachine[]>([]);
  protected readonly search = signal('');
  protected readonly filteredNumbers = computed(() => {
    const query = this.search().trim().toLocaleLowerCase();
    return this.numbers().filter((number) =>
      !query || [number.cashier_code, this.serialPreview(number.serial_number), String(number.max_sequential_number ?? '')]
        .some((value) => value?.toLocaleLowerCase().includes(query)),
    );
  });
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly mode = signal<'list' | 'create' | 'edit'>('list');
  protected readonly editingId = signal<string | null>(null);
  protected readonly deleteTarget = signal<DocumentSequentialNumber | null>(null);

  // El número de serie debe caer dentro del rango [serial_start, serial_end] del grupo.
  private readonly serialRangeValidator = (control: AbstractControl): ValidationErrors | null => {
    const serial = control.value as number | null;
    if (serial === null || serial === undefined) return null;
    const group = this.group();
    if (!group) return null;
    if (group.serial_start !== null && serial < group.serial_start) return { range: true };
    const endRaw = (group.serial_end ?? '').toString().trim();
    const end = endRaw !== '' && Number.isFinite(Number(endRaw)) ? Number(endRaw) : null;
    return end !== null && serial > end ? { range: true } : null;
  };

  protected readonly form = this.fb.nonNullable.group({
    cashier_code: ['', Validators.required],
    serial_number: this.fb.control<number | null>(null, [Validators.required, this.serialRangeValidator]),
    max_sequential_number: this.fb.control<number | null>(null, Validators.required),
    is_active: [true],
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    forkJoin({
      group: this.groupService.getById(this.groupId),
      numbers: this.numberService.getByGroupId(this.groupId),
      cashiers: this.cashierMachineService.getAll(),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ group, numbers, cashiers }) => {
          this.group.set(group ?? null);
          this.numbers.set(numbers ?? []);
          this.cashierMachines.set(cashiers ?? []);
          this.form.controls.serial_number.updateValueAndValidity();
        },
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  protected groupLabel(): string {
    const group = this.group();
    if (!group) return this.groupId;
    return `${group.serial_prefix || '—'} (${group.serial_start ?? '—'} - ${group.serial_end || '—'})`;
  }

  protected serialPreview(serialNumber: number | null): string {
    const prefix = this.group()?.serial_prefix ?? '';
    if (serialNumber === null || serialNumber === undefined) return `${prefix}····`;
    return `${prefix}${String(serialNumber).padStart(4, '0')}`;
  }

  protected goBack(): void {
    this.router.navigateByUrl('/document_serial_groups');
  }

  protected startCreate(): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(null);
    this.form.reset({ cashier_code: '', serial_number: null, max_sequential_number: null, is_active: true });
    this.mode.set('create');
  }

  protected startEdit(number: DocumentSequentialNumber): void {
    if (!number.id || this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(number.id);
    this.form.reset({
      cashier_code: number.cashier_code ?? '',
      serial_number: number.serial_number,
      max_sequential_number: number.max_sequential_number,
      is_active: number.is_active,
    });
    this.mode.set('edit');
  }

  protected cancelForm(): void {
    if (this.isSaving()) return;
    this.mode.set('list');
    this.editingId.set(null);
    this.form.reset();
  }

  protected submit(): void {
    if (this.isSaving() || this.mode() === 'list') return;
    this.clearMessages();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: DocumentSequentialNumber = {
      id: this.editingId(),
      document_serial_group_id: this.groupId,
      cashier_code: raw.cashier_code.trim() || null,
      serial_number: raw.serial_number,
      max_sequential_number: raw.max_sequential_number,
      is_active: raw.is_active,
      created_at: null,
      updated_at: null,
      created_by: null,
      modified_by: null,
    };
    const isCreate = this.mode() === 'create';
    this.isSaving.set(true);
    const request$ = isCreate ? this.numberService.add(payload) : this.numberService.update(payload);
    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.mode.set('list');
        this.editingId.set(null);
        this.form.reset();
        this.successMessage.set(
          isCreate ? 'Número secuencial creado correctamente.' : 'Número secuencial actualizado correctamente.',
        );
        this.load();
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  protected askDelete(number: DocumentSequentialNumber): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(number);
  }

  protected cancelDelete(): void {
    if (!this.isSaving()) this.deleteTarget.set(null);
  }

  protected confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target?.id || this.isSaving()) return;
    this.isSaving.set(true);
    this.numberService.delete(target.id).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.deleteTarget.set(null);
        this.successMessage.set('Número secuencial eliminado correctamente.');
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.deleteTarget.set(null);
        this.errorMessage.set(this.resolveError(error));
      },
    });
  }

  private clearMessages(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  private resolveError(error: HttpErrorResponse): string {
    if (typeof error.error === 'string' && error.error.trim()) return error.error;
    if (error.status === 0) return 'No se pudo conectar con el servidor. Verifica tu conexión.';
    return 'Ocurrió un error inesperado. Intenta nuevamente.';
  }
}
