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
import { Airport, Feature, FeatureGroup, LocalUser, NotificationRecipient } from '../models';
import {
  AirportService,
  FeatureCatalogService,
  LocalUserService,
  NotificationRecipientService,
} from '../services';
import { notBlank } from '../validators/not-blank.validator';

type FormMode = 'list' | 'create' | 'edit';
type AddressKind = 'email' | 'phone' | null;

const EVENT_TYPE_GROUP = 'tipos evento sistema';
const CHANNEL_GROUP = 'canales notificacion';
const LEVEL_GROUP = 'niveles log';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_CHARS_PATTERN = /^\+?[0-9\s\-().]+$/;

@Component({
  selector: 'app-notification-recipients',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './notification-recipients.html',
  styleUrl: '../catalogs/catalog-crud.css',
})
export class NotificationRecipients implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly recipientService = inject(NotificationRecipientService);
  private readonly airportService = inject(AirportService);
  private readonly userService = inject(LocalUserService);
  private readonly catalog = inject(FeatureCatalogService);

  protected readonly recipients = signal<NotificationRecipient[]>([]);
  protected readonly airports = signal<Airport[]>([]);
  protected readonly users = signal<LocalUser[]>([]);
  protected readonly groups = signal<FeatureGroup[]>([]);
  protected readonly eventTypes = computed(() =>
    this.catalog.featuresOf(this.groups(), EVENT_TYPE_GROUP),
  );
  protected readonly channels = computed(() =>
    this.catalog.featuresOf(this.groups(), CHANNEL_GROUP),
  );
  protected readonly levels = computed(() => this.catalog.featuresOf(this.groups(), LEVEL_GROUP));

  protected readonly selectedEventTypeId = signal<number | null>(null);
  protected readonly selectedChannelId = signal<number | null>(null);
  protected readonly search = signal('');
  protected readonly filteredRecipients = computed(() => {
    const eventTypeId = this.selectedEventTypeId();
    const channelId = this.selectedChannelId();
    const query = this.search().trim().toLocaleLowerCase();
    return this.recipients()
      .filter(
        (recipient) =>
          (eventTypeId === null || recipient.event_type_id === eventTypeId) &&
          (channelId === null || recipient.channel_id === channelId) &&
          (!query || (recipient.recipient_address ?? '').toLocaleLowerCase().includes(query)),
      )
      .sort(
        (a, b) =>
          this.featureLabel(a.event_type_id).localeCompare(this.featureLabel(b.event_type_id)) ||
          this.featureLabel(a.channel_id).localeCompare(this.featureLabel(b.channel_id)) ||
          (a.recipient_address ?? '').localeCompare(b.recipient_address ?? ''),
      );
  });
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly mode = signal<FormMode>('list');
  protected readonly editingId = signal<string | null>(null);
  protected readonly deleteTarget = signal<NotificationRecipient | null>(null);
  private editingRecord: NotificationRecipient | null = null;

  protected readonly form = this.fb.nonNullable.group(
    {
      airport_id: this.fb.control<string | null>(null),
      event_type_id: this.fb.control<number | null>(null, Validators.required),
      channel_id: this.fb.control<number | null>(null, Validators.required),
      local_user_id: this.fb.control<string | null>(null),
      recipient_address: ['', [Validators.required, notBlank, Validators.maxLength(200)]],
      min_level_id: this.fb.control<number | null>(null),
      is_active: [true],
    },
    { validators: [(group: AbstractControl) => this.addressFormat(group)] },
  );

  ngOnInit(): void {
    this.loadCatalogs();
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    forkJoin({
      recipients: this.recipientService.getAll(),
      airports: this.airportService.getAll(),
      users: this.userService.getAll(),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ recipients, airports, users }) => {
          this.recipients.set(recipients ?? []);
          this.airports.set(airports ?? []);
          this.users.set((users ?? []).filter((user) => !user.is_deleted));
        },
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  private loadCatalogs(): void {
    this.catalog.loadGroups([EVENT_TYPE_GROUP, CHANNEL_GROUP, LEVEL_GROUP]).subscribe({
      next: (groups) => this.groups.set(groups),
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  protected featureText(feature: Feature): string {
    return feature.description || feature.abbreviation || String(feature.id);
  }

  protected featureLabel(id: number | null): string {
    return this.catalog.label(this.groups(), id);
  }

  protected airportLabel(id: string | null): string {
    if (!id) return 'Todos';
    const airport = this.airports().find((item) => item.id === id);
    if (!airport) return id;
    const code = airport.iata_code || airport.oaci_code;
    return `${airport.name || code || id}${airport.name && code ? ` (${code})` : ''}`;
  }

  protected userLabel(id: string | null): string {
    if (!id) return '—';
    const user = this.users().find((item) => item.id === id);
    if (!user) return id;
    const name = user.name || user.email || id;
    return `${name}${user.email && name !== user.email ? ` (${user.email})` : ''}`;
  }

  protected addressPlaceholder(): string {
    const kind = this.addressKind(this.form.controls.channel_id.value);
    if (kind === 'email') return 'nombre@dominio.com';
    if (kind === 'phone') return '+51999999999';
    return 'Correo electrónico o teléfono';
  }

  protected startCreate(): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(null);
    this.editingRecord = null;
    this.resetForm();
    this.form.patchValue({
      event_type_id: this.selectedEventTypeId(),
      channel_id: this.selectedChannelId(),
    });
    this.mode.set('create');
  }

  protected startEdit(recipient: NotificationRecipient): void {
    if (!recipient.id || this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.editingId.set(recipient.id);
    this.editingRecord = recipient;
    this.form.reset({
      airport_id: recipient.airport_id,
      event_type_id: recipient.event_type_id,
      channel_id: recipient.channel_id,
      local_user_id: recipient.local_user_id,
      recipient_address: recipient.recipient_address ?? '',
      min_level_id: recipient.min_level_id,
      is_active: recipient.is_active,
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

  protected onLocalUserChange(): void {
    // Si la dirección está vacía y el canal es correo, se sugiere el correo del usuario.
    const address = this.form.controls.recipient_address;
    if (address.value.trim()) return;
    if (this.addressKind(this.form.controls.channel_id.value) !== 'email') return;
    const user = this.users().find((item) => item.id === this.form.controls.local_user_id.value);
    if (user?.email) address.setValue(user.email);
  }

  protected submit(): void {
    if (this.isSaving() || this.mode() === 'list') return;
    this.clearMessages();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const address = raw.recipient_address.trim();
    const duplicate = this.recipients().some(
      (item) =>
        item.id !== this.editingId() &&
        (item.airport_id ?? null) === raw.airport_id &&
        item.event_type_id === raw.event_type_id &&
        item.channel_id === raw.channel_id &&
        (item.recipient_address ?? '').trim().toLocaleLowerCase() === address.toLocaleLowerCase(),
    );
    if (duplicate) {
      this.errorMessage.set(
        'Ya existe un destinatario con el mismo aeropuerto, evento, canal y dirección.',
      );
      return;
    }

    const isCreate = this.mode() === 'create';
    const current = isCreate ? null : this.editingRecord;
    const payload: NotificationRecipient = {
      ...current,
      id: isCreate ? null : this.editingId(),
      airport_id: raw.airport_id,
      event_type_id: raw.event_type_id as number,
      channel_id: raw.channel_id as number,
      local_user_id: raw.local_user_id,
      recipient_address: address,
      min_level_id: raw.min_level_id,
      is_active: isCreate ? true : raw.is_active,
      created_at: current?.created_at ?? null,
      updated_at: current?.updated_at ?? null,
      created_by: current?.created_by ?? null,
      modified_by: current?.modified_by ?? null,
    };
    this.isSaving.set(true);
    const request$ = isCreate
      ? this.recipientService.add(payload)
      : this.recipientService.update(payload);
    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.mode.set('list');
        this.editingId.set(null);
        this.editingRecord = null;
        this.resetForm();
        this.successMessage.set(
          isCreate
            ? 'Destinatario creado correctamente.'
            : 'Destinatario actualizado correctamente.',
        );
        this.load();
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  protected askDelete(recipient: NotificationRecipient): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(recipient);
  }

  protected cancelDelete(): void {
    if (!this.isSaving()) this.deleteTarget.set(null);
  }

  protected confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target?.id || this.isSaving()) return;
    this.isSaving.set(true);
    this.recipientService
      .delete(target.id)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.deleteTarget.set(null);
          this.successMessage.set('Destinatario desactivado correctamente.');
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          this.deleteTarget.set(null);
          this.errorMessage.set(this.resolveError(error));
        },
      });
  }

  // Tipo de dirección esperado según el canal elegido (EMAIL o SMS); sin canal conocido no se valida.
  private addressKind(channelId: number | null): AddressKind {
    if (channelId === null) return null;
    const channel = this.channels().find((item) => item.id === channelId);
    const key = (channel?.abbreviation ?? '').trim().toLocaleUpperCase();
    if (key === 'EMAIL') return 'email';
    if (key === 'SMS') return 'phone';
    return null;
  }

  private addressFormat(group: AbstractControl): ValidationErrors | null {
    const address = String(group.get('recipient_address')?.value ?? '').trim();
    if (!address) return null;
    const kind = this.addressKind((group.get('channel_id')?.value as number | null) ?? null);
    if (kind === 'email' && !EMAIL_PATTERN.test(address)) return { addressFormat: 'email' };
    if (kind === 'phone') {
      const digits = address.replace(/\D/g, '');
      if (!PHONE_CHARS_PATTERN.test(address) || digits.length < 7 || digits.length > 15) {
        return { addressFormat: 'phone' };
      }
    }
    return null;
  }

  private resetForm(): void {
    this.form.reset({
      airport_id: null,
      event_type_id: null,
      channel_id: null,
      local_user_id: null,
      recipient_address: '',
      min_level_id: null,
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
