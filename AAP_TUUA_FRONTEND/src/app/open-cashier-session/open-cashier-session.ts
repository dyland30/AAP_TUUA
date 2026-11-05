import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormRecord, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Observable,
  catchError,
  concat,
  finalize,
  forkJoin,
  map,
  of,
  switchMap,
  tap,
  throwError,
  toArray,
} from 'rxjs';
import {
  Airport,
  CashFlow,
  CashierMachine,
  CashierMachineSession,
  Feature,
  FeatureGroup,
  LocalUser,
  Terminal,
} from '../models';
import { AirportService } from '../services/airport.service';
import { AuthenticationService } from '../services/authentication.service';
import { CashFlowService } from '../services/cash-flow.service';
import { CashierMachineSessionService } from '../services/cashier-machine-session.service';
import { CashierMachineService } from '../services/cashier-machine.service';
import { FeatureService } from '../services/feature.service';
import { LocalUserCashierMachineService } from '../services/local-user-cashier-machine.service';
import { LocalUserService } from '../services/local-user.service';
import { TerminalService } from '../services/terminal.service';
import { twoDecimals } from '../validators/two-decimals.validator';

interface InitialAmount {
  currencyId: number;
  amount: number;
}

@Component({
  selector: 'app-open-cashier-session',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './open-cashier-session.html',
  styleUrls: ['../catalogs/catalog-crud.css', './open-cashier-session.css'],
})
export class OpenCashierSession implements OnInit {
  private static readonly CurrencyGroupNames = ['Monedas', 'Moneda'];
  private static readonly SessionStatusGroupNames = ['Estados Turno Caja'];
  private static readonly PaymentTypeGroupNames = ['Tipos de Pago'];
  private static readonly OpenStatusName = 'abierto';
  private static readonly CashPaymentName = 'efectivo';

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthenticationService);
  private readonly localUserService = inject(LocalUserService);
  private readonly assignmentService = inject(LocalUserCashierMachineService);
  private readonly cashierMachineService = inject(CashierMachineService);
  private readonly terminalService = inject(TerminalService);
  private readonly airportService = inject(AirportService);
  private readonly featureService = inject(FeatureService);
  private readonly sessionService = inject(CashierMachineSessionService);
  private readonly cashFlowService = inject(CashFlowService);

  // Llega en true cuando otra pantalla (p. ej. Movimientos de caja) exige un turno abierto.
  protected readonly sessionRequired = this.route.snapshot.queryParamMap.has('required');
  protected readonly user = signal<LocalUser | null>(null);
  protected readonly machines = signal<CashierMachine[]>([]);
  protected readonly terminals = signal<Terminal[]>([]);
  protected readonly airports = signal<Airport[]>([]);
  protected readonly groups = signal<FeatureGroup[]>([]);
  protected readonly catalogLoaded = signal(false);
  protected readonly selectedMachineCode = signal<string | null>(null);
  protected readonly openSession = signal<CashierMachineSession | null>(null);
  // Turno abierto desde esta pantalla: sigue bloqueando una nueva apertura, pero sin el aviso de "ya abierto".
  protected readonly justOpenedSessionId = signal<string | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly isCheckingOpenSession = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  protected readonly amounts = new FormRecord<FormControl<number | null>>({});

  protected readonly currencyFeatures = computed(() =>
    this.featuresOfGroup(OpenCashierSession.CurrencyGroupNames).filter((feature) => feature.is_active),
  );
  private readonly openStatus = computed(() =>
    this.findFeature(OpenCashierSession.SessionStatusGroupNames, OpenCashierSession.OpenStatusName),
  );
  private readonly cashPaymentType = computed(() =>
    this.findFeature(OpenCashierSession.PaymentTypeGroupNames, OpenCashierSession.CashPaymentName),
  );
  protected readonly configurationError = computed(() => {
    if (!this.catalogLoaded()) return null;
    if (this.currencyFeatures().length === 0) {
      return 'No hay monedas activas registradas en el catálogo "Monedas".';
    }
    if (!this.openStatus()) {
      return 'No se encontró el estado "Abierto" en el catálogo "Estados Turno Caja".';
    }
    if (!this.cashPaymentType()) {
      return 'No se encontró el tipo de pago "Efectivo" en el catálogo "Tipos de Pago".';
    }
    return null;
  });
  protected readonly selectedMachine = computed(
    () => this.machines().find((machine) => machine.code === this.selectedMachineCode()) ?? null,
  );
  protected readonly selectedAirportLabel = computed(() => {
    const terminalId = this.selectedMachine()?.terminal_id;
    if (!terminalId) return '';
    const terminal = this.terminals().find((item) => item.id === terminalId);
    return this.airportLabel(terminal?.airport_id ?? null);
  });
  protected readonly operatorLabel = computed(() => {
    const user = this.user();
    const email = user?.email ?? this.auth.getCurrentUser()?.email ?? '';
    return user?.name ? `${user.name} — ${email}` : email;
  });
  protected readonly canSubmit = computed(
    () =>
      !this.isLoading() &&
      !this.isSaving() &&
      !this.isCheckingOpenSession() &&
      !!this.selectedMachineCode() &&
      !this.openSession() &&
      !this.configurationError(),
  );

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    const userId = this.auth.getCurrentUser()?.user_id;
    if (!userId) {
      this.errorMessage.set('No se pudo identificar al usuario autenticado.');
      return;
    }

    this.isLoading.set(true);
    this.clearMessages();
    forkJoin({
      user: this.localUserService.getById(userId),
      assignments: this.assignmentService.getByLocalUserId(userId),
      machines: this.cashierMachineService.getAll(),
      terminals: this.terminalService.getAll(),
      airports: this.airportService.getAll(),
      groups: this.loadCatalog(),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ user, assignments, machines, terminals, airports, groups }) => {
          const assignedCodes = new Set(
            (assignments ?? [])
              .map((assignment) => assignment.cashier_machine_code)
              .filter((code): code is string => !!code),
          );
          const assignedMachines = (machines ?? []).filter(
            (machine) => machine.is_active && !!machine.code && assignedCodes.has(machine.code),
          );
          this.user.set(user);
          this.machines.set(assignedMachines);
          this.terminals.set(terminals ?? []);
          this.airports.set(airports ?? []);
          this.groups.set(groups);
          this.buildAmountControls();
          this.catalogLoaded.set(true);
          if (assignedMachines.length === 1) {
            this.selectMachine(assignedMachines[0].code);
          }
        },
        error: (error: unknown) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  private loadCatalog(): Observable<FeatureGroup[]> {
    const relevantNames = [
      ...OpenCashierSession.CurrencyGroupNames,
      ...OpenCashierSession.SessionStatusGroupNames,
      ...OpenCashierSession.PaymentTypeGroupNames,
    ];
    return this.featureService.getAllFeatureGroups().pipe(
      switchMap((groups) => {
        const relevant = (groups ?? []).filter((group) =>
          relevantNames.some((name) => OpenCashierSession.sameName(group.name, name)),
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
    );
  }

  private buildAmountControls(): void {
    for (const key of Object.keys(this.amounts.controls)) this.amounts.removeControl(key);
    for (const feature of this.currencyFeatures()) {
      this.amounts.addControl(
        this.controlName(feature.id),
        new FormControl<number | null>(0, [
          (control) => (control.value !== null && control.value < 0 ? { min: true } : null),
          twoDecimals,
        ]),
      );
    }
  }

  protected controlName(featureId: number): string {
    return String(featureId);
  }

  protected currencyLabel(feature: Feature): string {
    const name = feature.description || String(feature.id);
    return feature.abbreviation ? `${name} (${feature.abbreviation})` : name;
  }

  protected machineLabel(machine: CashierMachine): string {
    const description = machine.description ? ` · ${machine.description}` : '';
    const ip = machine.ipaddr ? ` [${machine.ipaddr}]` : '';
    return `${machine.code ?? ''}${description}${ip}`;
  }

  protected airportLabel(id: string | null): string {
    if (!id) return '';
    const airport = this.airports().find((item) => item.id === id);
    if (!airport) return id;
    const code = airport.iata_code || airport.oaci_code;
    return code && airport.name ? `${code} — ${airport.name}` : airport.name || code || id;
  }

  protected selectMachine(code: string | null): void {
    this.selectedMachineCode.set(code);
    this.openSession.set(null);
    this.justOpenedSessionId.set(null);
    this.successMessage.set(null);
    if (!code) return;

    this.isCheckingOpenSession.set(true);
    this.sessionService
      .getOpenByCashierMachineCode(code)
      .pipe(finalize(() => this.isCheckingOpenSession.set(false)))
      .subscribe({
        next: (session) => {
          // Se ignora la respuesta si el usuario ya cambió de caja.
          if (this.selectedMachineCode() !== code) return;
          this.openSession.set(this.isOpen(session) ? session : null);
        },
        error: (error: unknown) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  protected submit(): void {
    if (!this.canSubmit()) return;
    this.clearMessages();

    const machineCode = this.selectedMachineCode();
    const userId = this.auth.getCurrentUser()?.user_id;
    const openStatus = this.openStatus();
    const cashPayment = this.cashPaymentType();
    if (!machineCode || !userId || !openStatus || !cashPayment) return;

    if (this.amounts.invalid) {
      this.amounts.markAllAsTouched();
      this.errorMessage.set('Revisa los montos ingresados.');
      return;
    }

    const initialAmounts: InitialAmount[] = this.currencyFeatures()
      .map((feature) => ({ currencyId: feature.id, amount: this.amountOf(feature.id) }))
      .filter((item) => item.amount > 0);
    const createdCashFlowIds: string[] = [];

    this.isSaving.set(true);
    // Se vuelve a consultar el turno abierto para no depender de un estado desactualizado.
    this.sessionService
      .getOpenByCashierMachineCode(machineCode)
      .pipe(
        switchMap((current) =>
          this.isOpen(current)
            ? throwError(
                () => new Error('La caja ya tiene un turno abierto. Ciérralo antes de abrir uno nuevo.'),
              )
            : this.sessionService.add(this.buildSession(machineCode, userId, openStatus.id)),
        ),
        switchMap((session) =>
          this.registerInitialAmounts(session, initialAmounts, cashPayment.id, createdCashFlowIds).pipe(
            map(() => session),
            // No hay transacción entre turno y montos: si algo falla se revierte lo creado.
            catchError((error: unknown) =>
              this.rollback(session, createdCashFlowIds).pipe(
                switchMap(() => throwError(() => error)),
              ),
            ),
          ),
        ),
        finalize(() => this.isSaving.set(false)),
      )
      .subscribe({
        next: (session) => {
          this.openSession.set(session);
          this.justOpenedSessionId.set(session.id);
          this.resetAmounts();
          this.successMessage.set(`Turno abierto correctamente en la caja ${session.cashier_machine_code}.`);
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.resolveError(error));
          this.selectMachine(machineCode);
        },
      });
  }

  protected cancel(): void {
    if (this.isSaving()) return;
    this.router.navigateByUrl('/');
  }

  private buildSession(
    machineCode: string,
    userId: string,
    statusId: number,
  ): CashierMachineSession {
    return {
      id: null,
      cashier_machine_code: machineCode,
      local_user_id: userId,
      start_time: this.toApiDateTime(new Date()),
      end_time: null,
      status_id: statusId,
      is_active: true,
      created_at: null,
      updated_at: null,
      created_by: null,
      modified_by: null,
    };
  }

  private registerInitialAmounts(
    session: CashierMachineSession,
    amounts: InitialAmount[],
    paymentTypeId: number,
    createdIds: string[],
  ): Observable<unknown> {
    const sessionId = session.id;
    if (!sessionId) return throwError(() => new Error('No se pudo obtener el turno registrado.'));

    const requests = amounts.map((item) => {
      const cashFlow: CashFlow = {
        id: null,
        cashier_machine_session_id: sessionId,
        tuua_sales_operation_id: null,
        money_exchange_operation_id: null,
        direction: 'I',
        operator: 1,
        payment_type_id: paymentTypeId,
        currency_id: item.currencyId,
        amount: item.amount,
        reference_code: null,
        observation: 'Monto inicial de apertura de turno',
        is_active: true,
        created_at: null,
        updated_at: null,
        created_by: null,
        modified_by: null,
      };
      return this.cashFlowService.add(cashFlow).pipe(
        tap((created) => {
          if (created.id) createdIds.push(created.id);
        }),
      );
    });
    return concat(...requests).pipe(toArray());
  }

  private rollback(session: CashierMachineSession, cashFlowIds: string[]): Observable<unknown> {
    const undo: Observable<unknown>[] = cashFlowIds.map((id) => this.cashFlowService.delete(id));
    if (session.id) undo.push(this.sessionService.delete(session.id));
    return concat(...undo.map((request) => request.pipe(catchError(() => of(null))))).pipe(toArray());
  }

  private isOpen(session: CashierMachineSession | null): session is CashierMachineSession {
    const openStatus = this.openStatus();
    return !!session && !!openStatus && session.status_id === openStatus.id;
  }

  private amountOf(featureId: number): number {
    return Number(this.amounts.controls[this.controlName(featureId)]?.value ?? 0);
  }

  private resetAmounts(): void {
    for (const control of Object.values(this.amounts.controls)) control.reset(0);
  }

  private featuresOfGroup(names: string[]): Feature[] {
    const group = this.groups().find((item) =>
      names.some((name) => OpenCashierSession.sameName(item.name, name)),
    );
    return group?.features ?? [];
  }

  // Busca un valor del catálogo por descripción o valor, sin distinguir mayúsculas ni tildes.
  private findFeature(groupNames: string[], name: string): Feature | null {
    const target = OpenCashierSession.normalize(name);
    return (
      this.featuresOfGroup(groupNames).find(
        (feature) =>
          feature.is_active &&
          [feature.description, feature.feature_value].some(
            (value) => OpenCashierSession.normalize(value) === target,
          ),
      ) ?? null
    );
  }

  private static normalize(value: string | null): string {
    return (value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLocaleLowerCase();
  }

  private static sameName(candidate: string | null, target: string): boolean {
    return OpenCashierSession.normalize(candidate) === OpenCashierSession.normalize(target);
  }

  // Fecha y hora local sin zona horaria, como se envían los demás campos timestamp.
  private toApiDateTime(value: Date): string {
    const pad = (part: number) => `${part}`.padStart(2, '0');
    const date = `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
    return `${date}T${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
  }

  private clearMessages(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  private resolveError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error === 'string' && error.error.trim()) return error.error;
      if (error.status === 0) return 'No se pudo conectar con el servidor. Verifica tu conexión.';
    } else if (error instanceof Error && error.message) {
      return error.message;
    }
    return 'Ocurrió un error inesperado. Intenta nuevamente.';
  }
}
