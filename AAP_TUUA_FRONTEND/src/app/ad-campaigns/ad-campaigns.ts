import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { AdCampaign, Airport, Company, FeatureGroup } from '../models';
import {
  AdCampaignService,
  AirportService,
  CompanyService,
  FeatureCatalogService,
} from '../services';
import { notBlank } from '../validators/not-blank.validator';

type FormMode = 'list' | 'create' | 'edit';

const STATUS_GROUP = 'estados campana';
const PRIORITY_GROUP = 'prioridad campana';

// Días de la semana: 1 = lunes ... 7 = domingo (convención ISO, igual que days_of_week de los itinerarios).
const WEEK_DAYS: { value: number; short: string; label: string }[] = [
  { value: 1, short: 'Lun', label: 'Lunes' },
  { value: 2, short: 'Mar', label: 'Martes' },
  { value: 3, short: 'Mié', label: 'Miércoles' },
  { value: 4, short: 'Jue', label: 'Jueves' },
  { value: 5, short: 'Vie', label: 'Viernes' },
  { value: 6, short: 'Sáb', label: 'Sábado' },
  { value: 7, short: 'Dom', label: 'Domingo' },
];

// La fecha de fin no puede ser anterior a la de inicio (cadenas ISO 'YYYY-MM-DD').
function endDateNotBeforeStart(control: AbstractControl<string>): ValidationErrors | null {
  const start = control.parent?.get('start_date')?.value as string | undefined;
  return start && control.value && control.value < start ? { dateRange: true } : null;
}

// Hora diaria de inicio/fin: se indican ambas o ninguna.
function pairedTime(otherControl: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const other = control.parent?.get(otherControl)?.value as string | undefined;
    return !control.value && other ? { paired: true } : null;
  };
}

@Component({
  selector: 'app-ad-campaigns',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './ad-campaigns.html',
  styleUrl: '../catalogs/catalog-crud.css',
})
export class AdCampaigns implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly campaignService = inject(AdCampaignService);
  private readonly airportService = inject(AirportService);
  private readonly companyService = inject(CompanyService);
  private readonly featureCatalog = inject(FeatureCatalogService);

  protected readonly weekDays = WEEK_DAYS;
  protected readonly campaigns = signal<AdCampaign[]>([]);
  protected readonly airports = signal<Airport[]>([]);
  protected readonly companies = signal<Company[]>([]);
  protected readonly groups = signal<FeatureGroup[]>([]);
  protected readonly statuses = computed(() =>
    this.featureCatalog.featuresOf(this.groups(), STATUS_GROUP),
  );
  protected readonly priorities = computed(() =>
    this.featureCatalog.featuresOf(this.groups(), PRIORITY_GROUP),
  );
  protected readonly selectedAirportId = signal<string | null>(null);
  protected readonly selectedStatusId = signal<number | null>(null);
  protected readonly search = signal('');
  protected readonly filteredCampaigns = computed(() => {
    const airportId = this.selectedAirportId();
    const statusId = this.selectedStatusId();
    const query = this.search().trim().toLocaleLowerCase();
    return this.campaigns().filter(
      (campaign) =>
        (!airportId || campaign.airport_id === airportId) &&
        (statusId === null || campaign.status_id === statusId) &&
        (!query ||
          [campaign.name, campaign.description, this.companyLabel(campaign.company_id)].some(
            (value) => value?.toLocaleLowerCase().includes(query),
          )),
    );
  });
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly mode = signal<FormMode>('list');
  protected readonly editingId = signal<string | null>(null);
  protected readonly deleteTarget = signal<AdCampaign | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    airport_id: this.fb.control<string | null>(null, Validators.required),
    company_id: this.fb.control<string | null>(null),
    name: ['', [Validators.required, notBlank, Validators.maxLength(200)]],
    description: ['', [Validators.maxLength(500)]],
    start_date: ['', [Validators.required]],
    end_date: ['', [Validators.required, endDateNotBeforeStart]],
    daily_start_time: ['', [pairedTime('daily_end_time')]],
    daily_end_time: ['', [pairedTime('daily_start_time')]],
    days_of_week: this.fb.nonNullable.control<number[]>([]),
    priority_id: this.fb.control<number | null>(null, Validators.required),
    status_id: this.fb.control<number | null>(null, Validators.required),
    is_active: [true],
  });

  private readonly formCompanyId = toSignal(this.form.controls.company_id.valueChanges, {
    initialValue: this.form.controls.company_id.value,
  });
  protected readonly formDays = toSignal(this.form.controls.days_of_week.valueChanges, {
    initialValue: this.form.controls.days_of_week.value,
  });
  // Empresas activas (más la ya asignada a la campaña, aunque esté inactiva).
  protected readonly companyOptions = computed(() =>
    this.companies().filter((company) => company.is_active || company.id === this.formCompanyId()),
  );

  constructor() {
    const controls = this.form.controls;
    // Las validaciones cruzadas se reevalúan cuando cambia el campo relacionado.
    controls.start_date.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => controls.end_date.updateValueAndValidity({ emitEvent: false }));
    controls.daily_start_time.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => controls.daily_end_time.updateValueAndValidity({ emitEvent: false }));
    controls.daily_end_time.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => controls.daily_start_time.updateValueAndValidity({ emitEvent: false }));
  }

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    forkJoin({
      campaigns: this.campaignService.getAll(),
      airports: this.airportService.getAll(),
      companies: this.companyService.getAll(),
      groups: this.featureCatalog.loadGroups([STATUS_GROUP, PRIORITY_GROUP]),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ campaigns, airports, companies, groups }) => {
          this.campaigns.set(campaigns ?? []);
          this.airports.set(airports ?? []);
          this.companies.set(companies ?? []);
          this.groups.set(groups ?? []);
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

  protected companyLabel(id: string | null): string {
    if (!id) return '—';
    const company = this.companies().find((item) => item.id === id);
    return company?.company_name || company?.business_name || id;
  }

  protected featureLabel(id: number | null): string {
    return this.featureCatalog.label(this.groups(), id);
  }

  protected formatDate(value: string | null): string {
    const iso = this.toDateInput(value);
    if (!iso) return '—';
    const [year, month, day] = iso.split('-');
    return `${day}/${month}/${year}`;
  }

  protected scheduleLabel(campaign: AdCampaign): string {
    const start = this.toTimeInput(campaign.daily_start_time);
    const end = this.toTimeInput(campaign.daily_end_time);
    return start && end ? `${start} - ${end}` : 'Todo el día';
  }

  protected daysLabel(campaign: AdCampaign): string {
    const days = campaign.days_of_week ?? [];
    if (days.length === 0 || days.length >= WEEK_DAYS.length) return 'Todos los días';
    return WEEK_DAYS.filter((day) => days.includes(day.value))
      .map((day) => day.short)
      .join(', ');
  }

  protected isDaySelected(day: number): boolean {
    return this.formDays().includes(day);
  }

  protected toggleDay(day: number, checked: boolean): void {
    const current = this.form.controls.days_of_week.value;
    const next = checked ? [...new Set([...current, day])] : current.filter((item) => item !== day);
    this.form.controls.days_of_week.setValue(next.sort((a, b) => a - b));
    this.form.controls.days_of_week.markAsDirty();
  }

  protected viewItems(campaign: AdCampaign): void {
    if (!campaign.id) return;
    this.router.navigate(['/ad_campaigns', campaign.id, 'items']);
  }

  protected viewBehaviorGroups(campaign: AdCampaign): void {
    if (!campaign.id) return;
    this.router.navigate(['/ad_campaigns', campaign.id, 'behavior_groups']);
  }

  protected startCreate(): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(null);
    this.resetForm();
    this.form.patchValue({
      airport_id: this.selectedAirportId(),
      status_id: this.defaultFeatureId(STATUS_GROUP, 'DRAFT'),
      priority_id: this.defaultFeatureId(PRIORITY_GROUP, 'MEDIUM'),
    });
    this.mode.set('create');
  }

  protected startEdit(campaign: AdCampaign): void {
    if (!campaign.id || this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(campaign.id);
    this.form.reset({
      airport_id: campaign.airport_id,
      company_id: campaign.company_id,
      name: campaign.name ?? '',
      description: campaign.description ?? '',
      start_date: this.toDateInput(campaign.start_date),
      end_date: this.toDateInput(campaign.end_date),
      daily_start_time: this.toTimeInput(campaign.daily_start_time),
      daily_end_time: this.toTimeInput(campaign.daily_end_time),
      days_of_week: [...(campaign.days_of_week ?? [])].sort((a, b) => a - b),
      priority_id: campaign.priority_id,
      status_id: campaign.status_id,
      is_active: campaign.is_active,
    });
    this.mode.set('edit');
  }

  protected cancelForm(): void {
    if (this.isSaving()) return;
    this.mode.set('list');
    this.editingId.set(null);
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
    const current = isCreate ? null : this.campaigns().find((c) => c.id === this.editingId());
    const payload: AdCampaign = {
      ...(current ?? {
        created_at: null,
        updated_at: null,
        created_by: null,
        modified_by: null,
      }),
      id: this.editingId(),
      airport_id: raw.airport_id as string,
      company_id: raw.company_id,
      name: raw.name.trim(),
      description: raw.description.trim() || null,
      start_date: raw.start_date,
      end_date: raw.end_date,
      daily_start_time: this.toApiTime(raw.daily_start_time),
      daily_end_time: this.toApiTime(raw.daily_end_time),
      days_of_week: raw.days_of_week.length > 0 ? raw.days_of_week : null,
      priority_id: raw.priority_id as number,
      status_id: raw.status_id as number,
      is_active: isCreate ? true : raw.is_active,
    };
    this.isSaving.set(true);
    const request$ = isCreate
      ? this.campaignService.add(payload)
      : this.campaignService.update(payload);
    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.mode.set('list');
        this.editingId.set(null);
        this.resetForm();
        this.successMessage.set(
          isCreate ? 'Campaña creada correctamente.' : 'Campaña actualizada correctamente.',
        );
        this.load();
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  protected askDelete(campaign: AdCampaign): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(campaign);
  }

  protected cancelDelete(): void {
    if (!this.isSaving()) this.deleteTarget.set(null);
  }

  protected confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target?.id || this.isSaving()) return;
    this.isSaving.set(true);
    this.campaignService
      .delete(target.id)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.deleteTarget.set(null);
          this.successMessage.set('Campaña desactivada correctamente.');
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          this.deleteTarget.set(null);
          this.errorMessage.set(this.resolveError(error));
        },
      });
  }

  private defaultFeatureId(group: string, abbreviation: string): number | null {
    return this.featureCatalog.findByAbbreviation(this.groups(), group, abbreviation)?.id ?? null;
  }

  // El servidor devuelve '2026-11-10T00:00:00'; el input nativo espera 'YYYY-MM-DD'.
  private toDateInput(value: string | null): string {
    return value ? value.substring(0, 10) : '';
  }

  // El servidor devuelve 'HH:mm:ss'; el input nativo espera 'HH:mm'.
  private toTimeInput(value: string | null): string {
    return value ? value.substring(0, 5) : '';
  }

  private toApiTime(value: string): string | null {
    if (!value) return null;
    return value.length === 5 ? `${value}:00` : value;
  }

  private resetForm(): void {
    this.form.reset({
      airport_id: null,
      company_id: null,
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      daily_start_time: '',
      daily_end_time: '',
      days_of_week: [],
      priority_id: null,
      status_id: null,
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
