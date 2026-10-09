import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { finalize } from 'rxjs';
import { Resource } from '../models';
import { ResourceService } from '../services/resource.service';

type FormMode = 'list' | 'create' | 'edit';

@Component({
  selector: 'app-resources',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './resources.html',
  styleUrl: './resources.css',
})
export class Resources implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly resourceService = inject(ResourceService);

  protected readonly resources = signal<Resource[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly mode = signal<FormMode>('list');
  protected readonly editingId = signal<string | null>(null);
  protected readonly deleteTarget = signal<Resource | null>(null);

  protected readonly types = ['GROUP', 'UI'];
  protected readonly methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    description: [''],
    type: ['UI', [Validators.required]],
    path: ['', [Validators.required]],
    method: ['GET'],
    icon: [''],
    weight: this.fb.control<number | null>(null),
    parent_id: this.fb.control<string | null>(null),
    is_active: [true],
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.resourceService
      .getAll()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (resources) => this.resources.set(resources ?? []),
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  protected parentOptions(): Resource[] {
    const editingId = this.editingId();
    return this.resources().filter((resource) => resource.id !== editingId);
  }

  protected parentLabel(parentId: string | null): string {
    if (!parentId) {
      return '—';
    }
    return this.resources().find((resource) => resource.id === parentId)?.name ?? '—';
  }

  protected startCreate(): void {
    this.clearMessages();
    this.editingId.set(null);
    this.form.reset({
      name: '',
      description: '',
      type: 'UI',
      path: '',
      method: 'GET',
      icon: '',
      weight: null,
      parent_id: null,
      is_active: true,
    });
    this.mode.set('create');
  }

  protected startEdit(resource: Resource): void {
    this.clearMessages();
    this.editingId.set(resource.id);
    this.form.reset({
      name: resource.name ?? '',
      description: resource.description ?? '',
      type: resource.type ?? 'UI',
      path: resource.path ?? '',
      method: resource.method ?? 'GET',
      icon: resource.icon ?? '',
      weight: resource.weight,
      parent_id: resource.parent_id,
      is_active: resource.is_active ?? true,
    });
    this.mode.set('edit');
  }

  protected cancelForm(): void {
    this.mode.set('list');
    this.editingId.set(null);
    this.form.reset({
      name: '',
      description: '',
      type: 'UI',
      path: '',
      method: 'GET',
      icon: '',
      weight: null,
      parent_id: null,
      is_active: true,
    });
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
      ? this.resourceService.add(payload)
      : this.resourceService.update(payload);

    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.mode.set('list');
        this.editingId.set(null);
        this.successMessage.set(
          isCreate ? 'Recurso creado correctamente.' : 'Recurso actualizado correctamente.',
        );
        this.load();
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  protected askDelete(resource: Resource): void {
    this.clearMessages();
    this.deleteTarget.set(resource);
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
    this.resourceService
      .update({ ...target, is_active: false })
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.deleteTarget.set(null);
          this.successMessage.set('Recurso eliminado correctamente.');
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          this.deleteTarget.set(null);
          this.errorMessage.set(this.resolveError(error));
        },
      });
  }

  private buildPayload(): Resource {
    const raw = this.form.getRawValue();
    return {
      id: this.editingId(),
      name: raw.name,
      description: raw.description || null,
      parent_description: null,
      type: raw.type,
      path: raw.path,
      method: raw.method || null,
      parent_id: raw.parent_id,
      created_at: null,
      modified_at: null,
      created_by: null,
      modified_by: null,
      weight: raw.weight,
      icon: raw.icon || null,
      is_active: raw.is_active,
    };
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
