import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
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
import { Airline, Airport, Feature, FeatureGroup, VirtualKeypadButton } from '../models';
import {
  AirlineService,
  AirportService,
  FeatureCatalogService,
  VirtualKeypadButtonService,
} from '../services';
import { notBlank } from '../validators/not-blank.validator';

type FormMode = 'list' | 'create' | 'edit';

const STATUS_GROUP = 'estados vuelo fids';
const HEX_COLOR_PATTERN = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;
// Valor especial del filtro: botones sin aeropuerto / sin aerolínea (configuración global).
const GLOBAL = '__global__';
const MIN_SORT_ORDER = -32768;
const MAX_SORT_ORDER = 32767;

function integerNumber(control: AbstractControl<number | null>): ValidationErrors | null {
  const value = control.value;
  return value === null || value === undefined || Number.isInteger(value)
    ? null
    : { integer: true };
}

@Component({
  selector: 'app-virtual-keypad-buttons',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './virtual-keypad-buttons.html',
  styleUrl: '../catalogs/catalog-crud.css',
})
export class VirtualKeypadButtons implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly buttonService = inject(VirtualKeypadButtonService);
  private readonly airportService = inject(AirportService);
  private readonly airlineService = inject(AirlineService);
  private readonly catalog = inject(FeatureCatalogService);

  protected readonly globalFilter = GLOBAL;
  protected readonly buttons = signal<VirtualKeypadButton[]>([]);
  protected readonly airports = signal<Airport[]>([]);
  protected readonly airlines = signal<Airline[]>([]);
  protected readonly groups = signal<FeatureGroup[]>([]);
  protected readonly statuses = computed(() =>
    this.catalog.featuresOf(this.groups(), STATUS_GROUP),
  );

  protected readonly selectedAirportId = signal<string | null>(null);
  protected readonly selectedAirlineId = signal<string | null>(null);
  protected readonly search = signal('');
  protected readonly filteredButtons = computed(() => {
    const airportId = this.selectedAirportId();
    const airlineId = this.selectedAirlineId();
    const query = this.search().trim().toLocaleLowerCase();
    return this.buttons()
      .filter(
        (button) =>
          (!airportId ||
            (airportId === GLOBAL ? !button.airport_id : button.airport_id === airportId)) &&
          (!airlineId ||
            (airlineId === GLOBAL ? !button.airline_id : button.airline_id === airlineId)) &&
          (!query ||
            [button.label_es, button.label_en].some((value) =>
              value?.toLocaleLowerCase().includes(query),
            )),
      )
      .sort(
        (a, b) => a.sort_order - b.sort_order || (a.label_es ?? '').localeCompare(b.label_es ?? ''),
      );
  });
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly mode = signal<FormMode>('list');
  protected readonly editingId = signal<string | null>(null);
  protected readonly deleteTarget = signal<VirtualKeypadButton | null>(null);
  private editingRecord: VirtualKeypadButton | null = null;

  protected readonly form = this.fb.nonNullable.group({
    airport_id: this.fb.control<string | null>(null),
    airline_id: this.fb.control<string | null>(null),
    target_status_id: this.fb.control<number | null>(null, Validators.required),
    label_es: ['', [Validators.required, notBlank, Validators.maxLength(50)]],
    label_en: ['', [Validators.maxLength(50)]],
    color: ['', [Validators.maxLength(9), Validators.pattern(HEX_COLOR_PATTERN)]],
    sort_order: this.fb.control<number | null>(0, [
      Validators.required,
      integerNumber,
      Validators.min(MIN_SORT_ORDER),
      Validators.max(MAX_SORT_ORDER),
    ]),
    requires_confirmation: [false],
    is_active: [true],
  });

  ngOnInit(): void {
    this.loadCatalogs();
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    forkJoin({
      buttons: this.buttonService.getAll(),
      airports: this.airportService.getAll(),
      airlines: this.airlineService.getAll(),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ buttons, airports, airlines }) => {
          this.buttons.set(buttons ?? []);
          this.airports.set(airports ?? []);
          this.airlines.set(airlines ?? []);
        },
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  private loadCatalogs(): void {
    this.catalog.loadGroups([STATUS_GROUP]).subscribe({
      next: (groups) => this.groups.set(groups),
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  protected featureText(feature: Feature): string {
    return feature.description || feature.abbreviation || String(feature.id);
  }

  protected statusLabel(id: number | null): string {
    return this.catalog.label(this.groups(), id);
  }

  protected airportLabel(id: string | null): string {
    if (!id) return 'Todos';
    const airport = this.airports().find((item) => item.id === id);
    if (!airport) return id;
    const code = airport.iata_code || airport.oaci_code;
    return `${airport.name || code || id}${airport.name && code ? ` (${code})` : ''}`;
  }

  protected airlineLabel(id: string | null): string {
    if (!id) return 'Todas';
    const airline = this.airlines().find((item) => item.id === id);
    if (!airline) return id;
    const code = airline.iata_code || airline.oaci_code;
    const name = airline.company_name || airline.short_name || code || id;
    return `${name}${code && name !== code ? ` (${code})` : ''}${airline.is_active ? '' : ' - inactiva'}`;
  }

  protected startCreate(): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(null);
    this.editingRecord = null;
    this.resetForm();
    const airportId = this.selectedAirportId();
    const airlineId = this.selectedAirlineId();
    this.form.patchValue({
      airport_id: airportId && airportId !== GLOBAL ? airportId : null,
      airline_id: airlineId && airlineId !== GLOBAL ? airlineId : null,
    });
    this.mode.set('create');
  }

  protected startEdit(button: VirtualKeypadButton): void {
    if (!button.id || this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(button.id);
    this.editingRecord = button;
    this.form.reset({
      airport_id: button.airport_id,
      airline_id: button.airline_id,
      target_status_id: button.target_status_id,
      label_es: button.label_es ?? '',
      label_en: button.label_en ?? '',
      color: button.color ?? '',
      sort_order: button.sort_order,
      requires_confirmation: button.requires_confirmation,
      is_active: button.is_active,
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
    const payload: VirtualKeypadButton = {
      ...current,
      id: isCreate ? null : this.editingId(),
      airport_id: raw.airport_id,
      airline_id: raw.airline_id,
      target_status_id: raw.target_status_id as number,
      label_es: raw.label_es.trim(),
      label_en: raw.label_en.trim() || null,
      color: raw.color.trim() || null,
      sort_order: raw.sort_order as number,
      requires_confirmation: raw.requires_confirmation,
      is_active: isCreate ? true : raw.is_active,
      created_at: current?.created_at ?? null,
      updated_at: current?.updated_at ?? null,
      created_by: current?.created_by ?? null,
      modified_by: current?.modified_by ?? null,
    };
    this.isSaving.set(true);
    const request$ = isCreate
      ? this.buttonService.add(payload)
      : this.buttonService.update(payload);
    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.mode.set('list');
        this.editingId.set(null);
        this.editingRecord = null;
        this.resetForm();
        this.successMessage.set(
          isCreate ? 'Botón creado correctamente.' : 'Botón actualizado correctamente.',
        );
        this.load();
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  protected askDelete(button: VirtualKeypadButton): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(button);
  }

  protected cancelDelete(): void {
    if (!this.isSaving()) this.deleteTarget.set(null);
  }

  protected confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target?.id || this.isSaving()) return;
    this.isSaving.set(true);
    this.buttonService
      .delete(target.id)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.deleteTarget.set(null);
          this.successMessage.set('Botón desactivado correctamente.');
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
      airline_id: null,
      target_status_id: null,
      label_es: '',
      label_en: '',
      color: '',
      sort_order: 0,
      requires_confirmation: false,
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
