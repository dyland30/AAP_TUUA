import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, concat, forkJoin, of } from 'rxjs';
import { finalize, map, switchMap } from 'rxjs/operators';
import { Feature, LocalUser, TuuaGateUnlockKey } from '../models';
import { FeatureService } from '../services/feature.service';
import { LocalUserService } from '../services/local-user.service';
import { TuuaGateUnlockKeyService } from '../services/tuua-gate-unlock-key.service';

@Component({
  selector: 'app-assign-gate-unlock-keys',
  imports: [MatButtonModule, MatCheckboxModule, MatIconModule],
  templateUrl: './assign-gate-unlock-keys.html',
  styleUrl: './assign-gate-unlock-keys.css',
})
export class AssignGateUnlockKeys implements OnInit {
  private static readonly KeyTypeGroupName = 'Tipos de Llaves de Destrabe';

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly localUserService = inject(LocalUserService);
  private readonly featureService = inject(FeatureService);
  private readonly unlockKeyService = inject(TuuaGateUnlockKeyService);

  private readonly userId = this.route.snapshot.paramMap.get('userId');
  // Llave activa del usuario por tipo (type_id), necesaria para poder revocarla.
  private originalKeys = new Map<number, TuuaGateUnlockKey>();

  protected readonly user = signal<LocalUser | null>(null);
  protected readonly keyTypes = signal<Feature[]>([]);
  protected readonly selectedTypeIds = signal<ReadonlySet<number>>(new Set<number>());
  protected readonly selectedCount = computed(() => this.selectedTypeIds().size);
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly busyKeyId = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    if (!this.userId) {
      this.errorMessage.set('No se especificó un usuario.');
      return;
    }

    this.isLoading.set(true);
    this.clearMessages();

    forkJoin({
      user: this.localUserService.getById(this.userId),
      keyTypes: this.loadKeyTypes(),
      keys: this.unlockKeyService.getByUserId(this.userId),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ user, keyTypes, keys }) => {
          this.user.set(user);
          this.keyTypes.set(keyTypes);
          const active = new Map<number, TuuaGateUnlockKey>();
          for (const key of keys ?? []) {
            if (key.is_active && !active.has(key.type_id)) active.set(key.type_id, key);
          }
          this.originalKeys = active;
          this.selectedTypeIds.set(new Set(active.keys()));
        },
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  protected isSelected(typeId: number): boolean {
    return this.selectedTypeIds().has(typeId);
  }

  protected keyCode(typeId: number): string | null {
    return this.originalKeys.get(typeId)?.code ?? null;
  }

  protected keyId(typeId: number): string | null {
    return this.originalKeys.get(typeId)?.id ?? null;
  }

  protected downloadPdf(keyId: string): void {
    if (this.busyKeyId()) return;
    this.clearMessages();
    this.busyKeyId.set(keyId);
    this.unlockKeyService
      .downloadPdf(keyId)
      .pipe(finalize(() => this.busyKeyId.set(null)))
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `llave-destrabe-${keyId}.pdf`;
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        },
        error: (error: unknown) => this.resolveBlobError(error),
      });
  }

  // Desactiva la llave de inmediato; los cambios de selección sin guardar se descartan al recargar.
  protected deactivate(keyId: string): void {
    if (this.busyKeyId()) return;
    this.clearMessages();
    this.busyKeyId.set(keyId);
    this.unlockKeyService
      .delete(keyId)
      .pipe(finalize(() => this.busyKeyId.set(null)))
      .subscribe({
        next: () => {
          this.load();
          this.successMessage.set('Llave de destrabe desactivada.');
        },
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  protected toggle(type: Feature): void {
    this.clearMessages();
    const next = new Set(this.selectedTypeIds());
    if (next.has(type.id)) {
      next.delete(type.id);
    } else {
      next.add(type.id);
    }
    this.selectedTypeIds.set(next);
  }

  protected save(): void {
    if (!this.userId || this.isSaving()) return;

    this.clearMessages();
    const selected = this.selectedTypeIds();
    const added = [...selected].filter((id) => !this.originalKeys.has(id));
    const removed = [...this.originalKeys.entries()].filter(([id]) => !selected.has(id));

    const requests: Observable<unknown>[] = [];
    for (const [, key] of removed) {
      if (key.id) requests.push(this.unlockKeyService.delete(key.id));
    }
    for (const typeId of added) {
      const key: TuuaGateUnlockKey = {
        id: null,
        user_id: this.userId,
        code: null,
        type_id: typeId,
        is_active: true,
        created_at: null,
        updated_at: null,
        created_by: null,
        modified_by: null,
      };
      requests.push(this.unlockKeyService.add(key));
    }

    if (requests.length === 0) {
      this.successMessage.set('No hay cambios por guardar.');
      return;
    }

    this.isSaving.set(true);
    concat(...requests)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        complete: () => {
          this.load();
          this.successMessage.set('Llaves de destrabe asignadas correctamente.');
        },
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  protected back(): void {
    this.router.navigate(['/users']);
  }

  private loadKeyTypes(): Observable<Feature[]> {
    return this.featureService.getAllFeatureGroups().pipe(
      switchMap((groups) => {
        const group = (groups ?? []).find(
          (item) =>
            item.name?.trim().toLocaleLowerCase() ===
            AssignGateUnlockKeys.KeyTypeGroupName.toLocaleLowerCase(),
        );
        return group ? this.featureService.getFeaturesByGroup(group.id) : of<Feature[]>([]);
      }),
      map((features) => (features ?? []).filter((feature) => feature.is_active)),
    );
  }

  private clearMessages(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  // Con responseType blob el mensaje de error del servidor llega como Blob de texto.
  private resolveBlobError(error: unknown): void {
    if (error instanceof HttpErrorResponse && error.error instanceof Blob) {
      error.error.text().then((text) =>
        this.errorMessage.set(text.trim() || 'No se pudo generar el PDF.'),
      );
      return;
    }
    this.errorMessage.set(
      error instanceof HttpErrorResponse
        ? this.resolveError(error)
        : 'Ocurrió un error inesperado. Intenta nuevamente.',
    );
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
