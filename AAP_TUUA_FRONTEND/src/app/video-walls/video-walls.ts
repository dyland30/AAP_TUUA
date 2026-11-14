import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { finalize, forkJoin } from 'rxjs';
import { Airport, AirportSector, BehaviorGroup, Terminal, VideoWall } from '../models';
import {
  AirportSectorService,
  AirportService,
  BehaviorGroupService,
  TerminalService,
  VideoWallService,
} from '../services';
import { notBlank } from '../validators/not-blank.validator';

type FormMode = 'list' | 'create' | 'edit';

// Máximo de monitores por video wall (parámetro MAX_MONITORS_VIDEO_WALL, valor por defecto 6).
// El servidor valida el máximo configurado; aquí se aplica el valor por defecto como guía.
const MAX_MONITORS = 6;

function integerNumber(control: AbstractControl<number | null>): ValidationErrors | null {
  const value = control.value;
  return value === null || value === undefined || Number.isInteger(value)
    ? null
    : { integer: true };
}

function maxMonitors(group: AbstractControl): ValidationErrors | null {
  const rows = Number(group.get('grid_rows')?.value);
  const columns = Number(group.get('grid_columns')?.value);
  return rows > 0 && columns > 0 && rows * columns > MAX_MONITORS ? { maxMonitors: true } : null;
}

@Component({
  selector: 'app-video-walls',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './video-walls.html',
  styleUrl: '../catalogs/catalog-crud.css',
})
export class VideoWalls implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly wallService = inject(VideoWallService);
  private readonly airportService = inject(AirportService);
  private readonly terminalService = inject(TerminalService);
  private readonly sectorService = inject(AirportSectorService);
  private readonly behaviorGroupService = inject(BehaviorGroupService);

  protected readonly maxMonitors = MAX_MONITORS;
  protected readonly walls = signal<VideoWall[]>([]);
  protected readonly airports = signal<Airport[]>([]);
  protected readonly terminals = signal<Terminal[]>([]);
  protected readonly sectors = signal<AirportSector[]>([]);
  protected readonly behaviorGroups = signal<BehaviorGroup[]>([]);
  protected readonly selectedAirportId = signal<string | null>(null);
  protected readonly search = signal('');
  protected readonly filteredWalls = computed(() => {
    const airportId = this.selectedAirportId();
    const query = this.search().trim().toLocaleLowerCase();
    return this.walls().filter(
      (wall) =>
        (!airportId || wall.airport_id === airportId) &&
        (!query ||
          [wall.code, wall.name].some((value) => value?.toLocaleLowerCase().includes(query))),
    );
  });
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly mode = signal<FormMode>('list');
  protected readonly editingId = signal<string | null>(null);
  protected readonly deleteTarget = signal<VideoWall | null>(null);
  private editingRecord: VideoWall | null = null;

  protected readonly form = this.fb.nonNullable.group(
    {
      airport_id: this.fb.control<string | null>(null, Validators.required),
      terminal_id: this.fb.control<string | null>(null),
      airport_sector_id: this.fb.control<string | null>(null),
      code: ['', [Validators.required, notBlank, Validators.maxLength(30)]],
      name: ['', [Validators.required, notBlank, Validators.maxLength(100)]],
      grid_rows: this.fb.control<number | null>(1, [
        Validators.required,
        integerNumber,
        Validators.min(1),
        Validators.max(MAX_MONITORS),
      ]),
      grid_columns: this.fb.control<number | null>(1, [
        Validators.required,
        integerNumber,
        Validators.min(1),
        Validators.max(MAX_MONITORS),
      ]),
      behavior_group_id: this.fb.control<string | null>(null),
      is_active: [true],
    },
    { validators: [maxMonitors] },
  );

  private readonly formAirportId = toSignal(this.form.controls.airport_id.valueChanges, {
    initialValue: this.form.controls.airport_id.value,
  });
  protected readonly formTerminals = computed(() =>
    this.terminals().filter(
      (terminal) => terminal.airport_id === this.formAirportId() && terminal.is_active,
    ),
  );
  protected readonly formSectors = computed(() =>
    this.sectors().filter(
      (sector) => sector.airport_id === this.formAirportId() && sector.is_active,
    ),
  );
  // Grupos del aeropuerto elegido o globales (sin aeropuerto).
  protected readonly formBehaviorGroups = computed(() =>
    this.behaviorGroups().filter(
      (group) =>
        group.is_active && (group.airport_id === null || group.airport_id === this.formAirportId()),
    ),
  );

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    forkJoin({
      walls: this.wallService.getAll(),
      airports: this.airportService.getAll(),
      terminals: this.terminalService.getAll(),
      sectors: this.sectorService.getAll(),
      behaviorGroups: this.behaviorGroupService.getAll(),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ walls, airports, terminals, sectors, behaviorGroups }) => {
          this.walls.set(walls ?? []);
          this.airports.set(airports ?? []);
          this.terminals.set(terminals ?? []);
          this.sectors.set(sectors ?? []);
          this.behaviorGroups.set(behaviorGroups ?? []);
        },
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  protected airportLabel(id: string | null): string {
    if (!id) return '—';
    const airport = this.airports().find((item) => item.id === id);
    if (!airport) return id;
    const code = airport.iata_code || airport.oaci_code;
    return `${airport.name || code || id}${airport.name && code ? ` (${code})` : ''}`;
  }

  protected terminalLabel(id: string | null): string {
    if (!id) return '—';
    return this.terminals().find((item) => item.id === id)?.name || id;
  }

  protected sectorLabel(id: string | null): string {
    if (!id) return '—';
    const sector = this.sectors().find((item) => item.id === id);
    return sector ? `${sector.code} · ${sector.name}` : id;
  }

  protected behaviorGroupLabel(id: string | null): string {
    if (!id) return '—';
    const group = this.behaviorGroups().find((item) => item.id === id);
    return group ? `${group.code} · ${group.name}` : id;
  }

  protected gridLabel(wall: VideoWall): string {
    return `${wall.grid_rows} × ${wall.grid_columns} (${wall.grid_rows * wall.grid_columns} monitores)`;
  }

  protected startCreate(): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(null);
    this.editingRecord = null;
    this.resetForm();
    this.form.controls.airport_id.setValue(this.selectedAirportId());
    this.mode.set('create');
  }

  protected startEdit(wall: VideoWall): void {
    if (!wall.id || this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(wall.id);
    this.editingRecord = wall;
    this.form.reset({
      airport_id: wall.airport_id,
      terminal_id: wall.terminal_id,
      airport_sector_id: wall.airport_sector_id,
      code: wall.code ?? '',
      name: wall.name ?? '',
      grid_rows: wall.grid_rows,
      grid_columns: wall.grid_columns,
      behavior_group_id: wall.behavior_group_id,
      is_active: wall.is_active,
    });
    this.mode.set('edit');
  }

  protected cancelForm(): void {
    if (this.isSaving()) return;
    this.mode.set('list');
    this.editingId.set(null);
    this.editingRecord = null;
    this.resetForm();
  }

  protected onFormAirportChange(): void {
    // Terminal, sector y grupo de comportamiento dependen del aeropuerto elegido.
    this.form.patchValue({ terminal_id: null, airport_sector_id: null, behavior_group_id: null });
  }

  protected submit(): void {
    if (this.isSaving() || this.mode() === 'list') return;
    this.clearMessages();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const isCreate = this.mode() === 'create';
    const current = isCreate ? null : this.editingRecord;
    const payload: VideoWall = {
      ...current,
      id: isCreate ? null : this.editingId(),
      airport_id: raw.airport_id as string,
      terminal_id: raw.terminal_id,
      airport_sector_id: raw.airport_sector_id,
      code: raw.code.trim(),
      name: raw.name.trim(),
      grid_rows: raw.grid_rows as number,
      grid_columns: raw.grid_columns as number,
      behavior_group_id: raw.behavior_group_id,
      is_active: isCreate ? true : raw.is_active,
      created_at: current?.created_at ?? null,
      updated_at: current?.updated_at ?? null,
      created_by: current?.created_by ?? null,
      modified_by: current?.modified_by ?? null,
    };
    this.isSaving.set(true);
    const request$ = isCreate ? this.wallService.add(payload) : this.wallService.update(payload);
    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.mode.set('list');
        this.editingId.set(null);
        this.editingRecord = null;
        this.resetForm();
        this.successMessage.set(
          isCreate ? 'Video wall creado correctamente.' : 'Video wall actualizado correctamente.',
        );
        this.load();
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  protected askDelete(wall: VideoWall): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(wall);
  }

  protected cancelDelete(): void {
    if (!this.isSaving()) this.deleteTarget.set(null);
  }

  protected confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target?.id || this.isSaving()) return;
    this.isSaving.set(true);
    this.wallService
      .delete(target.id)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.deleteTarget.set(null);
          this.successMessage.set('Video wall desactivado correctamente.');
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          this.deleteTarget.set(null);
          this.errorMessage.set(this.resolveError(error));
        },
      });
  }

  private resetForm(): void {
    this.form.reset({
      airport_id: null,
      terminal_id: null,
      airport_sector_id: null,
      code: '',
      name: '',
      grid_rows: 1,
      grid_columns: 1,
      behavior_group_id: null,
      is_active: true,
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
