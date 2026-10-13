import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
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
import { finalize, forkJoin, map, of, switchMap } from 'rxjs';
import { Airport, CashierMachine, DocumentSequentialNumber, DocumentSerialGroup, Feature, FeatureGroup, Location, Terminal } from '../models';
import { AirportService, CashierMachineService, DocumentSerialGroupService, FeatureService, LocationService, TerminalService } from '../services';

type DetailForm = FormGroup<{
  cashier_code: FormControl<string | null>;
  serial_number: FormControl<number | null>;
  max_sequential_number: FormControl<number | null>;
}>;

@Component({
  selector: 'app-document-serial-groups',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './document-serial-groups.html',
  styleUrl: '../catalogs/catalog-crud.css',
})
export class DocumentSerialGroups implements OnInit {
  private static readonly DocumentTypeGroupName = 'Tipos Documentos TUUA';
  private static readonly SeaeTypeGroupName = 'Tipo Representación SEAE';
  private static readonly SaleTypeGroupName = 'Modalidad de Venta TUUA';

  private readonly fb = inject(FormBuilder);
  private readonly documentSerialGroupService = inject(DocumentSerialGroupService);
  private readonly cashierMachineService = inject(CashierMachineService);
  private readonly featureService = inject(FeatureService);
  private readonly terminalService = inject(TerminalService);
  private readonly locationService = inject(LocationService);
  private readonly airportService = inject(AirportService);

  protected readonly serialGroups = signal<DocumentSerialGroup[]>([]);
  protected readonly cashierMachines = signal<CashierMachine[]>([]);
  protected readonly terminals = signal<Terminal[]>([]);
  protected readonly locations = signal<Location[]>([]);
  protected readonly airports = signal<Airport[]>([]);
  protected readonly selectedAirportId = signal<string | null>(null);
  protected readonly filteredTerminals = computed(() => {
    const airportId = this.selectedAirportId();
    return airportId ? this.terminals().filter((terminal) => terminal.airport_id === airportId) : [];
  });
  protected readonly filteredLocations = computed(() => {
    const airportId = this.selectedAirportId();
    return airportId ? this.locations().filter((location) => location.airport_id === airportId) : [];
  });
  private readonly featureGroups = signal<FeatureGroup[]>([]);
  protected readonly documentTypeFeatures = computed(() => this.featuresOfGroup(DocumentSerialGroups.DocumentTypeGroupName));
  protected readonly seaeTypeFeatures = computed(() => this.featuresOfGroup(DocumentSerialGroups.SeaeTypeGroupName));
  protected readonly saleTypeFeatures = computed(() => this.featuresOfGroup(DocumentSerialGroups.SaleTypeGroupName));
  private readonly featureIndex = computed(() => {
    const index = new Map<number, Feature>();
    for (const group of this.featureGroups()) {
      for (const feature of group.features ?? []) index.set(feature.id, feature);
    }
    return index;
  });
  protected readonly search = signal('');
  protected readonly filteredGroups = computed(() => {
    const query = this.search().trim().toLocaleLowerCase();
    return this.serialGroups().filter((group) =>
      !query || [group.serial_prefix, this.featureLabel(group.document_type_id),
        this.featureLabel(group.seae_type_id), this.featureLabel(group.sale_type_id)]
        .some((value) => value?.toLocaleLowerCase().includes(query)),
    );
  });
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly mode = signal<'list' | 'create' | 'edit'>('list');
  protected readonly editingId = signal<string | null>(null);
  protected readonly deleteTarget = signal<DocumentSerialGroup | null>(null);

  // El serial final debe ser numérico y mayor o igual al serial inicial.
  private readonly serialEndValidator = (control: AbstractControl): ValidationErrors | null => {
    const raw = (control.value ?? '').toString().trim();
    if (raw === '') return null;
    const end = Number(raw);
    if (!Number.isFinite(end)) return { numeric: true };
    const start = this.form?.controls.serial_start.value ?? null;
    return start !== null && end < start ? { range: true } : null;
  };

  // Cada número de serie debe estar dentro del rango [serial_start, serial_end].
  private readonly serialRangeValidator = (control: AbstractControl): ValidationErrors | null => {
    const serial = control.value as number | null;
    if (serial === null || serial === undefined) return null;
    const start = this.form?.controls.serial_start.value ?? null;
    if (start !== null && serial < start) return { range: true };
    const endRaw = (this.form?.controls.serial_end.value ?? '').toString().trim();
    const end = endRaw !== '' && Number.isFinite(Number(endRaw)) ? Number(endRaw) : null;
    return end !== null && serial > end ? { range: true } : null;
  };

  protected readonly form = this.fb.nonNullable.group({
    document_type_id: this.fb.control<number | null>(null, Validators.required),
    seae_type_id: this.fb.control<number | null>(null, Validators.required),
    sale_type_id: this.fb.control<number | null>(null, Validators.required),
    serial_prefix: ['', [Validators.required, Validators.maxLength(2)]],
    terminal_id: this.fb.control<string | null>(null),
    location_id: this.fb.control<string | null>(null),
    serial_start: this.fb.control<number | null>(null, Validators.required),
    serial_end: ['', [Validators.required, Validators.maxLength(5), this.serialEndValidator]],
    is_active: [true],
  });
  protected readonly details = this.fb.array<DetailForm>([]);

  ngOnInit(): void {
    this.load();
    this.loadCatalog();
    this.form.controls.serial_start.valueChanges.subscribe(() => {
      this.form.controls.serial_end.updateValueAndValidity();
      this.details.updateValueAndValidity();
    });
    this.form.controls.serial_end.valueChanges.subscribe(() => this.details.updateValueAndValidity());
  }

  protected get detailControls(): DetailForm[] {
    return this.details.controls;
  }

  protected load(): void {
    this.isLoading.set(true);
    forkJoin({
      groups: this.documentSerialGroupService.getAll(),
      cashiers: this.cashierMachineService.getAll(),
      terminals: this.terminalService.getAll(),
      locations: this.locationService.getAll(),
      airports: this.airportService.getAll(),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ groups, cashiers, terminals, locations, airports }) => {
          this.serialGroups.set(groups ?? []);
          this.cashierMachines.set(cashiers ?? []);
          this.terminals.set(terminals ?? []);
          this.locations.set(locations ?? []);
          this.airports.set(airports ?? []);
        },
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  private loadCatalog(): void {
    this.featureService
      .getAllFeatureGroups()
      .pipe(
        switchMap((groups) => {
          const relevant = (groups ?? []).filter((group) =>
            [
              DocumentSerialGroups.DocumentTypeGroupName,
              DocumentSerialGroups.SeaeTypeGroupName,
              DocumentSerialGroups.SaleTypeGroupName,
            ].some((name) => DocumentSerialGroups.sameName(group.name, name)),
          );
          if (relevant.length === 0) return of<FeatureGroup[]>([]);
          return forkJoin(
            relevant.map((group) =>
              this.featureService
                .getFeaturesByGroup(group.id)
                .pipe(map((features) => ({ ...group, features: features ?? [] }))),
            ),
          );
        }),
      )
      .subscribe({
        next: (groups) => this.featureGroups.set(groups),
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  private featuresOfGroup(name: string): Feature[] {
    const group = this.featureGroups().find((item) => DocumentSerialGroups.sameName(item.name, name));
    return group?.features ?? [];
  }

  private static sameName(candidate: string | null, target: string): boolean {
    return (candidate ?? '').trim().toLocaleLowerCase() === target.trim().toLocaleLowerCase();
  }

  protected featureLabel(id: number | null): string {
    if (id === null) return '—';
    return this.featureIndex().get(id)?.description || String(id);
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
    const terminal = this.terminals().find((item) => item.id === id);
    if (!terminal) return id;
    return `${terminal.name || terminal.id} · ${this.airportLabel(terminal.airport_id)}`;
  }

  protected locationLabel(id: string | null): string {
    if (!id) return 'Sin sede';
    return this.locations().find((item) => item.id === id)?.name || id;
  }

  protected onAirportChange(airportId: string | null): void {
    this.selectedAirportId.set(airportId);
    const terminalId = this.form.controls.terminal_id.value;
    if (terminalId && !this.filteredTerminals().some((terminal) => terminal.id === terminalId)) {
      this.form.controls.terminal_id.setValue(null);
    }
    const locationId = this.form.controls.location_id.value;
    if (locationId && !this.filteredLocations().some((location) => location.id === locationId)) {
      this.form.controls.location_id.setValue(null);
    }
  }

  protected serialPreview(serialNumber: number | null): string {
    const prefix = this.form.controls.serial_prefix.value ?? '';
    if (serialNumber === null || serialNumber === undefined) return `${prefix}····`;
    return `${prefix}${String(serialNumber).padStart(3, '0')}`;
  }

  protected sequentialCount(group: DocumentSerialGroup): number {
    return group.sequential_numbers?.length ?? 0;
  }

  protected addDetail(): void {
    if (this.isSaving()) return;
    this.details.push(this.createDetailGroup());
  }

  protected removeDetail(index: number): void {
    if (this.isSaving()) return;
    this.details.removeAt(index);
  }

  protected startCreate(): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(null);
    this.selectedAirportId.set(null);
    this.details.clear();
    this.form.reset({
      document_type_id: null,
      seae_type_id: null,
      sale_type_id: null,
      serial_prefix: '',
      terminal_id: null,
      location_id: null,
      serial_start: null,
      serial_end: '',
      is_active: true,
    });
    this.mode.set('create');
  }

  protected startEdit(group: DocumentSerialGroup): void {
    if (!group.id || this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(group.id);
    this.isLoading.set(true);
    this.documentSerialGroupService
      .getById(group.id)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (full) => this.fillForm(full ?? group),
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  private fillForm(group: DocumentSerialGroup): void {
    const terminal = this.terminals().find((item) => item.id === group.terminal_id);
    this.selectedAirportId.set(terminal?.airport_id ?? null);
    this.form.reset({
      document_type_id: group.document_type_id,
      seae_type_id: group.seae_type_id,
      sale_type_id: group.sale_type_id,
      serial_prefix: group.serial_prefix ?? '',
      terminal_id: group.terminal_id,
      location_id: group.location_id,
      serial_start: group.serial_start,
      serial_end: group.serial_end ?? '',
      is_active: group.is_active,
    });
    this.details.clear();
    for (const detail of group.sequential_numbers ?? []) {
      this.details.push(this.createDetailGroup(detail.cashier_code, detail.serial_number, detail.max_sequential_number));
    }
    this.mode.set('edit');
  }

  protected cancelForm(): void {
    if (this.isSaving()) return;
    this.mode.set('list');
    this.editingId.set(null);
    this.details.clear();
    this.form.reset();
  }

  protected submit(): void {
    if (this.isSaving() || this.mode() === 'list') return;
    this.clearMessages();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.details.invalid) {
      this.details.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const sequentialNumbers: DocumentSequentialNumber[] = this.details.getRawValue().map((detail) => ({
      id: null,
      document_serial_group_id: this.editingId(),
      cashier_code: detail.cashier_code,
      serial_number: detail.serial_number,
      max_sequential_number: detail.max_sequential_number,
      is_active: true,
      created_at: null,
      updated_at: null,
      created_by: null,
      modified_by: null,
    }));
    const payload: DocumentSerialGroup = {
      id: this.editingId(),
      document_type_id: raw.document_type_id,
      seae_type_id: raw.seae_type_id,
      sale_type_id: raw.sale_type_id,
      serial_prefix: raw.serial_prefix.trim() || null,
      terminal_id: raw.terminal_id,
      location_id: raw.location_id,
      serial_start: raw.serial_start,
      serial_end: raw.serial_end.trim() || null,
      is_active: raw.is_active,
      created_at: null,
      updated_at: null,
      created_by: null,
      modified_by: null,
      sequential_numbers: sequentialNumbers,
    };

    const isCreate = this.mode() === 'create';
    this.isSaving.set(true);
    const request$ = isCreate
      ? this.documentSerialGroupService.add(payload)
      : this.documentSerialGroupService.update(payload);
    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.mode.set('list');
        this.editingId.set(null);
        this.details.clear();
        this.form.reset();
        this.successMessage.set(
          isCreate ? 'Grupo de seriales creado correctamente.' : 'Grupo de seriales actualizado correctamente.',
        );
        this.load();
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  protected askDelete(group: DocumentSerialGroup): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(group);
  }

  protected cancelDelete(): void {
    if (!this.isSaving()) this.deleteTarget.set(null);
  }

  protected confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target?.id || this.isSaving()) return;
    this.isSaving.set(true);
    this.documentSerialGroupService.delete(target.id).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.deleteTarget.set(null);
        this.successMessage.set('Grupo de seriales desactivado correctamente.');
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.deleteTarget.set(null);
        this.errorMessage.set(this.resolveError(error));
      },
    });
  }

  private createDetailGroup(
    cashierCode: string | null = null,
    serialNumber: number | null = null,
    maxSequential: number | null = null,
  ): DetailForm {
    return this.fb.group({
      cashier_code: this.fb.control<string | null>(cashierCode, Validators.required),
      serial_number: this.fb.control<number | null>(serialNumber, [Validators.required, this.serialRangeValidator]),
      max_sequential_number: this.fb.control<number | null>(maxSequential, Validators.required),
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
