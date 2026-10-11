import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  OnInit,
  TemplateRef,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  ControlValueAccessor,
  FormControl,
  FormGroupDirective,
  NgControl,
  NgForm,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { finalize, forkJoin } from 'rxjs';
import { UbigeoDepartamento, UbigeoDistrito, UbigeoProvincia } from '../models';
import { UbigeoService } from '../services/ubigeo.service';

type UbigeoOption = UbigeoDepartamento | UbigeoProvincia | UbigeoDistrito;

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();
}

function matches(option: UbigeoOption, value: UbigeoOption | string | null): boolean {
  const query = normalize(typeof value === 'string' ? value : '');
  return !query || normalize(`${option.codigo ?? ''} ${option.nombre ?? ''}`).includes(query);
}

@Component({
  selector: 'app-ubigeo-selector',
  imports: [
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './ubigeo-selector.html',
  styleUrl: './ubigeo-selector.css',
})
export class UbigeoSelector implements ControlValueAccessor, OnInit {
  private readonly ubigeoService = inject(UbigeoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  // Se registra como value accessor del control padre para poder leer sus
  // validadores (p. ej. obligatorio) y reflejar su estado de error en el campo.
  private readonly ngControl = inject(NgControl, { self: true, optional: true });
  private readonly selectionDialog = viewChild.required<TemplateRef<unknown>>('selectionDialog');
  private dialogRef: MatDialogRef<unknown, string> | null = null;
  protected readonly isDialogOpen = signal(false);
  readonly readonly = input(false);
  private readonly formDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.readonly() || this.formDisabled());

  protected readonly departamentos = signal<UbigeoDepartamento[]>([]);
  protected readonly provincias = signal<UbigeoProvincia[]>([]);
  protected readonly distritos = signal<UbigeoDistrito[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly isLoaded = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly code = signal('');
  protected readonly selectedDepartamento = signal<UbigeoDepartamento | null>(null);
  protected readonly selectedProvincia = signal<UbigeoProvincia | null>(null);
  protected readonly selectedDistrito = signal<UbigeoDistrito | null>(null);
  private readonly departamentoQuery = signal<UbigeoDepartamento | string | null>(null);
  private readonly provinciaQuery = signal<UbigeoProvincia | string | null>(null);
  private readonly distritoQuery = signal<UbigeoDistrito | string | null>(null);

  protected readonly codeControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.maxLength(10)],
  });
  protected readonly departamentoControl = new FormControl<UbigeoDepartamento | string | null>(null);
  protected readonly provinciaControl = new FormControl<UbigeoProvincia | string | null>(null);
  protected readonly distritoControl = new FormControl<UbigeoDistrito | string | null>(null);

  protected readonly filteredDepartamentos = computed(() => this.departamentos()
    .filter((item) => matches(item, this.departamentoQuery())));
  protected readonly filteredProvincias = computed(() => this.provincias().filter((item) =>
    !!this.selectedDepartamento() && item.codigo_departamento === this.selectedDepartamento()!.codigo &&
    matches(item, this.provinciaQuery()),
  ));
  protected readonly filteredDistritos = computed(() => this.distritos().filter((item) =>
    !!this.selectedProvincia() && item.codigo_provincia === this.selectedProvincia()!.codigo &&
    matches(item, this.distritoQuery()),
  ));
  // La visualización se resuelve desde el código guardado, no desde búsquedas parciales.
  protected readonly hierarchy = computed(() => {
    const distrito = this.distritos().find((item) => item.codigo === this.code().trim());
    if (!distrito) return null;
    const provincia = this.provincias().find((item) => item.codigo === distrito.codigo_provincia);
    if (!provincia) return null;
    const departamento = this.departamentos().find((item) => item.codigo === provincia.codigo_departamento);
    return departamento ? { departamento, provincia, distrito } : null;
  });

  protected readonly errorStateMatcher: ErrorStateMatcher = {
    isErrorState: (control: AbstractControl | null, form: FormGroupDirective | NgForm | null) => {
      const parent = this.ngControl?.control;
      const submitted = !!form?.submitted;
      const innerError = !!control?.invalid && (control.touched || submitted);
      const parentError = !!parent?.invalid && (parent.touched || submitted);
      return innerError || parentError;
    },
  };

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    if (this.ngControl) this.ngControl.valueAccessor = this;
    this.codeControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.code.set(value);
      this.syncHierarchy();
      this.onChange(value);
    });
    this.departamentoControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.departamentoQuery.set(value);
      this.selectedDepartamento.set(typeof value === 'object' ? value : null);
      this.resetProvincia();
    });
    this.provinciaControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.provinciaQuery.set(value);
      this.selectedProvincia.set(typeof value === 'object' ? value : null);
      this.resetDistrito();
    });
    this.distritoControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.distritoQuery.set(value);
      const distrito = typeof value === 'object' ? value : null;
      this.selectedDistrito.set(distrito);
    });
    effect(() => {
      this.setControlDisabled(this.codeControl, this.isDisabled());
      this.setControlDisabled(this.departamentoControl, this.isDisabled() || !this.isLoaded() || this.isLoading());
      this.setControlDisabled(this.provinciaControl,
        this.isDisabled() || this.isLoading() || !this.selectedDepartamento());
      this.setControlDisabled(this.distritoControl,
        this.isDisabled() || this.isLoading() || !this.selectedProvincia());
      if (this.isDisabled()) this.dialogRef?.close();
    });
    this.destroyRef.onDestroy(() => this.dialogRef?.close());
  }

  ngOnInit(): void {
    this.load();
  }

  writeValue(value: string | null): void {
    this.code.set(value ?? '');
    this.codeControl.setValue(value ?? '', { emitEvent: false });
    this.syncHierarchy();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }

  protected load(): void {
    if (this.isLoading()) return;
    this.isLoading.set(true);
    this.errorMessage.set(null);
    forkJoin({
      departamentos: this.ubigeoService.getAllDepartamentos(),
      provincias: this.ubigeoService.getAllProvincias(),
      distritos: this.ubigeoService.getAllDistritos(),
    }).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.isLoading.set(false))).subscribe({
      next: ({ departamentos, provincias, distritos }) => {
        this.departamentos.set(departamentos ?? []);
        this.provincias.set(provincias ?? []);
        this.distritos.set(distritos ?? []);
        this.isLoaded.set(true);
        this.syncHierarchy();
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(error.status === 0
        ? 'No se pudo conectar con el servidor para cargar los ubigeos.'
        : 'No se pudieron cargar los ubigeos. Intenta nuevamente.'),
    });
  }

  protected get isRequired(): boolean {
    return !!this.ngControl?.control?.hasValidator(Validators.required);
  }

  protected get hasRequiredError(): boolean {
    return !!this.ngControl?.control?.hasError('required');
  }

  protected displayOption(value: UbigeoOption | string | null): string {
    if (typeof value === 'string') return value;
    return value ? `${value.codigo} · ${value.nombre}` : '';
  }

  protected openDialog(): void {
    if (this.isDisabled() || this.isLoading() || !this.isLoaded() || this.dialogRef) return;
    this.syncHierarchy();
    this.markTouched();
    const ref = this.dialog.open<unknown, unknown, string>(this.selectionDialog(), {
      width: '900px',
      maxWidth: '95vw',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });
    this.dialogRef = ref;
    this.isDialogOpen.set(true);
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((codigo) => {
      this.dialogRef = null;
      this.isDialogOpen.set(false);
      if (codigo && !this.isDisabled()) this.changeCode(codigo);
      this.syncHierarchy();
    });
  }

  protected confirmSelection(): void {
    const codigo = this.selectedDistrito()?.codigo;
    if (codigo && !this.isDisabled()) this.dialogRef?.close(codigo);
  }

  protected cancelSelection(): void {
    this.dialogRef?.close();
  }

  protected clear(): void {
    if (this.isDisabled()) return;
    this.changeCode('');
    this.syncHierarchy();
  }

  protected markTouched(): void {
    this.codeControl.markAsTouched();
    this.onTouched();
  }

  private changeCode(value: string): void {
    this.code.set(value);
    this.codeControl.setValue(value, { emitEvent: false });
    this.onChange(value);
    this.markTouched();
  }

  private syncHierarchy(): void {
    const hierarchy = this.hierarchy();
    this.selectedDepartamento.set(hierarchy?.departamento ?? null);
    this.departamentoQuery.set(hierarchy?.departamento ?? null);
    this.departamentoControl.setValue(hierarchy?.departamento ?? null, { emitEvent: false });
    this.selectedProvincia.set(hierarchy?.provincia ?? null);
    this.provinciaQuery.set(hierarchy?.provincia ?? null);
    this.provinciaControl.setValue(hierarchy?.provincia ?? null, { emitEvent: false });
    this.selectedDistrito.set(hierarchy?.distrito ?? null);
    this.distritoQuery.set(hierarchy?.distrito ?? null);
    this.distritoControl.setValue(hierarchy?.distrito ?? null, { emitEvent: false });
  }

  private resetProvincia(): void {
    this.selectedProvincia.set(null);
    this.provinciaQuery.set(null);
    this.provinciaControl.setValue(null, { emitEvent: false });
    this.resetDistrito();
  }

  private resetDistrito(): void {
    this.selectedDistrito.set(null);
    this.distritoQuery.set(null);
    this.distritoControl.setValue(null, { emitEvent: false });
  }

  private setControlDisabled<T>(control: FormControl<T>, disabled: boolean): void {
    if (disabled && control.enabled) control.disable({ emitEvent: false });
    if (!disabled && control.disabled) control.enable({ emitEvent: false });
  }
}
