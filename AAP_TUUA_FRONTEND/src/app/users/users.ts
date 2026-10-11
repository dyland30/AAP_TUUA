import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { finalize } from 'rxjs';
import { LocalUser, Role } from '../models';
import { LocalUserService } from '../services/local-user.service';
import { RoleService } from '../services/role.service';

type FormMode = 'list' | 'create' | 'edit';

@Component({
  selector: 'app-users',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly localUserService = inject(LocalUserService);
  private readonly roleService = inject(RoleService);

  private readonly allUsers = signal<LocalUser[]>([]);

  protected readonly users = computed(() => this.allUsers().filter((user) => !user.is_deleted));
  protected readonly roles = signal<Role[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly mode = signal<FormMode>('list');
  protected readonly editingId = signal<string | null>(null);
  protected readonly deleteTarget = signal<LocalUser | null>(null);
  protected readonly hidePassword = signal(true);
  protected readonly editingWasExternal = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    confirm_password: [''],
    role_ids: this.fb.nonNullable.control<string[]>([]),
    is_external: [false],
  });

  ngOnInit(): void {
    this.load();
    this.loadRoles();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.localUserService
      .getAll()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (users) => this.allUsers.set(users ?? []),
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  private loadRoles(): void {
    this.roleService.getAll().subscribe({
      next: (roles) => this.roles.set((roles ?? []).filter((role) => role.is_active !== false)),
      error: () => this.roles.set([]),
    });
  }

  protected rolesLabel(user: LocalUser): string {
    const roles = user.roles?.map((role) => role.name).filter(Boolean) ?? [];
    return roles.length > 0 ? roles.join(', ') : 'Sin roles';
  }

  protected startCreate(): void {
    this.clearMessages();
    this.editingId.set(null);
    this.editingWasExternal.set(false);
    this.form.reset({ name: '', email: '', password: '', confirm_password: '', role_ids: [], is_external: false });
    this.mode.set('create');
  }

  protected startEdit(user: LocalUser): void {
    this.clearMessages();
    this.editingId.set(user.id);
    this.editingWasExternal.set(user.is_external);
    this.form.reset({
      name: user.name ?? '',
      email: user.email ?? '',
      password: '',
      confirm_password: '',
      role_ids: user.roles?.map((role) => role.id).filter((id): id is string => !!id) ?? [],
      is_external: user.is_external,
    });
    this.mode.set('edit');
  }

  protected cancelForm(): void {
    this.mode.set('list');
    this.editingId.set(null);
    this.form.reset({ name: '', email: '', password: '', confirm_password: '', role_ids: [], is_external: false });
  }

  protected togglePassword(): void {
    this.hidePassword.update((value) => !value);
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

    const raw = this.form.getRawValue();
    const isCreate = this.mode() === 'create';

    // Los usuarios corporativos se autentican con Entra ID y no tienen contraseña local.
    const requiresPassword = !raw.is_external && (isCreate || this.editingWasExternal());
    if (requiresPassword && !raw.password) {
      this.errorMessage.set('La contraseña es obligatoria para un usuario local.');
      return;
    }

    if (!raw.is_external && raw.password && raw.password !== raw.confirm_password) {
      this.errorMessage.set('Las contraseñas no coinciden.');
      return;
    }

    const payload = this.buildPayload();

    this.isSaving.set(true);
    const request = isCreate
      ? this.localUserService.add(payload)
      : this.localUserService.update(payload);

    request.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.mode.set('list');
        this.editingId.set(null);
        this.form.reset({ name: '', email: '', password: '', confirm_password: '', role_ids: [], is_external: false });
        this.successMessage.set(
          isCreate ? 'Usuario creado correctamente.' : 'Usuario actualizado correctamente.',
        );
        this.load();
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  protected askDelete(user: LocalUser): void {
    this.clearMessages();
    this.deleteTarget.set(user);
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
    this.localUserService
      .delete(target.id)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.deleteTarget.set(null);
          this.successMessage.set('Usuario eliminado correctamente.');
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          this.deleteTarget.set(null);
          this.errorMessage.set(this.resolveError(error));
        },
      });
  }

  private buildPayload(): LocalUser {
    const raw = this.form.getRawValue();
    const selectedRoleIds = new Set(raw.role_ids);
    const selectedRoles = this.roles().filter(
      (role): role is Role & { id: string } => !!role.id && selectedRoleIds.has(role.id),
    );

    return {
      id: this.editingId(),
      name: raw.name,
      email: raw.email,
      password_salt: null,
      password_hash: null,
      password_reset_token: null,
      password_reset_token_expires_at: null,
      created_at: null,
      modified_at: null,
      created_by: null,
      modified_by: null,
      is_active: true,
      is_deleted: false,
      is_verified: false,
      verification_code: null,
      reset_password_code: null,
      last_login_at: null,
      is_external: raw.is_external,
      password: raw.is_external ? null : raw.password || null,
      confirm_password: raw.is_external ? null : raw.confirm_password || null,
      roles: selectedRoles,
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
