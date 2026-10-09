import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { Observable, finalize } from 'rxjs';
import { Role } from '../models';
import { RoleService } from '../services/role.service';

type FormMode = 'list' | 'create' | 'edit';

@Component({
  selector: 'app-roles',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './roles.html',
  styleUrl: './roles.css',
})
export class Roles implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly roleService = inject(RoleService);
  private readonly router = inject(Router);

  protected readonly roles = signal<Role[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly mode = signal<FormMode>('list');
  protected readonly editingId = signal<string | null>(null);
  protected readonly deleteTarget = signal<Role | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.roleService
      .getAll()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (roles) => this.roles.set(roles ?? []),
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  protected startCreate(): void {
    this.clearMessages();
    this.editingId.set(null);
    this.form.reset({ name: '' });
    this.mode.set('create');
  }

  protected startEdit(role: Role): void {
    this.clearMessages();
    this.editingId.set(role.id);
    this.form.reset({ name: role.name ?? '' });
    this.mode.set('edit');
  }

  protected cancelForm(): void {
    this.mode.set('list');
    this.editingId.set(null);
    this.form.reset({ name: '' });
  }

  protected goToAssignResources(role: Role): void {
    if (!role.id) {
      return;
    }
    this.router.navigate(['/roles', role.id, 'resources']);
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
    const request$: Observable<unknown> = isCreate
      ? this.roleService.add(payload)
      : this.roleService.update(payload);

    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.mode.set('list');
        this.editingId.set(null);
        this.form.reset({ name: '' });
        this.successMessage.set(
          isCreate ? 'Rol creado correctamente.' : 'Rol actualizado correctamente.',
        );
        this.load();
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  protected askDelete(role: Role): void {
    this.clearMessages();
    this.deleteTarget.set(role);
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
    this.roleService
      .delete(target.id)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.deleteTarget.set(null);
          this.successMessage.set('Rol eliminado correctamente.');
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          this.deleteTarget.set(null);
          this.errorMessage.set(this.resolveError(error));
        },
      });
  }

  private buildPayload(): Role {
    const raw = this.form.getRawValue();
    return {
      id: this.editingId(),
      name: raw.name,
      created_at: null,
      modified_at: null,
      created_by: null,
      modified_by: null,
      is_active: true,
      resources: null,
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
