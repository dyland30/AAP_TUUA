import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { Observable, finalize, forkJoin } from 'rxjs';
import { UbigeoDepartamento, UbigeoDistrito, UbigeoProvincia } from '../models';
import { UbigeoService } from '../services/ubigeo.service';

type UbigeoLevel = 'departamento' | 'provincia' | 'distrito';
interface UbigeoRow extends UbigeoDepartamento {
  codigo_padre: string | null;
}

@Component({
  selector: 'app-ubigeos',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
  ],
  templateUrl: './ubigeos.html',
  styleUrl: '../catalogs/catalog-crud.css',
})
export class Ubigeos implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly ubigeoService = inject(UbigeoService);

  protected readonly departamentos = signal<UbigeoDepartamento[]>([]);
  protected readonly provincias = signal<UbigeoProvincia[]>([]);
  protected readonly distritos = signal<UbigeoDistrito[]>([]);
  protected readonly level = signal<UbigeoLevel>('departamento');
  protected readonly levelOptions = [
    { value: 'departamento', label: 'Departamentos' },
    { value: 'provincia', label: 'Provincias' },
    { value: 'distrito', label: 'Distritos' },
  ] as const;
  protected readonly levelLabel = computed(() => this.levelOptions.find((option) => option.value === this.level())!.label);
  protected readonly parentLabel = computed(() => this.level() === 'provincia' ? 'Departamento' : 'Provincia');
  protected readonly selectedDepartamento = signal<string | null>(null);
  protected readonly selectedProvincia = signal<string | null>(null);
  protected readonly search = signal('');
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(25);
  protected readonly filterProvincias = computed(() => this.provincias().filter((provincia) =>
    !this.selectedDepartamento() || provincia.codigo_departamento === this.selectedDepartamento(),
  ));
  protected readonly parentOptions = computed(() => this.level() === 'provincia'
    ? this.departamentos().map((item) => ({ codigo: item.codigo, label: `${item.codigo} · ${item.nombre}` }))
    : this.provincias().map((item) => ({ codigo: item.codigo,
      label: `${item.codigo} · ${item.nombre} (${this.departamentoLabel(item.codigo_departamento)})` })),
  );
  protected readonly filteredRows = computed<UbigeoRow[]>(() => {
    const level = this.level();
    const departamento = this.selectedDepartamento();
    const provincia = this.selectedProvincia();
    let rows: UbigeoRow[];
    if (level === 'departamento') {
      rows = this.departamentos().map((item) => ({ ...item, codigo_padre: null }));
    } else if (level === 'provincia') {
      rows = this.provincias().filter((item) => !departamento || item.codigo_departamento === departamento)
        .map((item) => ({ codigo: item.codigo, nombre: item.nombre, codigo_padre: item.codigo_departamento }));
    } else {
      const allowedProvincias = new Set(this.filterProvincias().map((item) => item.codigo));
      rows = this.distritos().filter((item) =>
        (!provincia || item.codigo_provincia === provincia) &&
        (!departamento || allowedProvincias.has(item.codigo_provincia)),
      ).map((item) => ({ codigo: item.codigo, nombre: item.nombre, codigo_padre: item.codigo_provincia }));
    }
    const query = this.search().trim().toLocaleLowerCase();
    return rows.filter((item) => [item.codigo, item.nombre, this.parentName(item.codigo_padre)]
      .some((value) => value?.toLocaleLowerCase().includes(query)));
  });
  protected readonly visibleRows = computed(() => this.filteredRows().slice(
    this.pageIndex() * this.pageSize(), (this.pageIndex() + 1) * this.pageSize(),
  ));
  protected readonly mode = signal<'list' | 'create' | 'edit'>('list');
  protected readonly deleteTarget = signal<UbigeoRow | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly form = this.fb.nonNullable.group({
    codigo: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(10)]],
    nombre: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
    codigo_padre: [''],
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    forkJoin({ departamentos: this.ubigeoService.getAllDepartamentos(),
      provincias: this.ubigeoService.getAllProvincias(), distritos: this.ubigeoService.getAllDistritos() })
      .pipe(finalize(() => this.isLoading.set(false))).subscribe({
        next: ({ departamentos, provincias, distritos }) => {
          this.departamentos.set(departamentos ?? []);
          this.provincias.set(provincias ?? []);
          this.distritos.set(distritos ?? []);
          if (!this.departamentos().some((item) => item.codigo === this.selectedDepartamento())) {
            this.selectedDepartamento.set(null);
          }
          if (!this.filterProvincias().some((item) => item.codigo === this.selectedProvincia())) {
            this.selectedProvincia.set(null);
          }
          const maxPage = Math.max(0, Math.ceil(this.filteredRows().length / this.pageSize()) - 1);
          this.pageIndex.set(Math.min(this.pageIndex(), maxPage));
        },
        error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
      });
  }

  protected selectLevel(level: UbigeoLevel): void {
    if (this.isSaving()) return;
    this.level.set(level);
    this.mode.set('list');
    this.deleteTarget.set(null);
    this.pageIndex.set(0);
    this.clearMessages();
  }

  protected selectDepartamento(codigo: string | null): void {
    this.selectedDepartamento.set(codigo);
    this.selectedProvincia.set(null);
    this.pageIndex.set(0);
  }

  protected selectProvincia(codigo: string | null): void {
    this.selectedProvincia.set(codigo);
    this.pageIndex.set(0);
  }

  protected setSearch(value: string): void {
    this.search.set(value);
    this.pageIndex.set(0);
  }

  protected changePage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  protected departamentoLabel(codigo: string | null): string {
    return this.departamentos().find((item) => item.codigo === codigo)?.nombre ?? codigo ?? '—';
  }

  protected parentName(codigo: string | null): string {
    if (!codigo || this.level() === 'departamento') return '—';
    return this.level() === 'provincia' ? this.departamentoLabel(codigo)
      : this.provincias().find((item) => item.codigo === codigo)?.nombre ?? codigo;
  }

  protected startCreate(): void {
    if (this.isSaving() || this.isLoading()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.configureForm();
    this.form.controls.codigo.enable();
    this.form.reset({ codigo: '', nombre: '', codigo_padre: this.level() === 'provincia'
      ? this.selectedDepartamento() ?? '' : this.level() === 'distrito' ? this.selectedProvincia() ?? '' : '' });
    this.mode.set('create');
  }

  protected startEdit(row: UbigeoRow): void {
    if (!row.codigo || this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(null);
    this.configureForm();
    this.form.reset({ codigo: row.codigo, nombre: row.nombre ?? '', codigo_padre: row.codigo_padre ?? '' });
    this.form.controls.codigo.disable();
    this.mode.set('edit');
  }

  protected cancelForm(): void {
    if (this.isSaving()) return;
    this.mode.set('list');
    this.form.controls.codigo.enable();
    this.form.reset();
  }

  protected submit(): void {
    if (this.isSaving() || this.mode() === 'list') return;
    this.clearMessages();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const payload: UbigeoDepartamento = { codigo: raw.codigo.trim(), nombre: raw.nombre.trim() };
    const isCreate = this.mode() === 'create';
    let request$: Observable<UbigeoDepartamento>;
    switch (this.level()) {
      case 'departamento':
        request$ = isCreate ? this.ubigeoService.addDepartamento(payload) : this.ubigeoService.updateDepartamento(payload);
        break;
      case 'provincia': {
        const provincia: UbigeoProvincia = { ...payload, codigo_departamento: raw.codigo_padre };
        request$ = isCreate ? this.ubigeoService.addProvincia(provincia) : this.ubigeoService.updateProvincia(provincia);
        break;
      }
      case 'distrito': {
        const distrito: UbigeoDistrito = { ...payload, codigo_provincia: raw.codigo_padre };
        request$ = isCreate ? this.ubigeoService.addDistrito(distrito) : this.ubigeoService.updateDistrito(distrito);
        break;
      }
    }
    this.isSaving.set(true);
    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.mode.set('list');
        this.form.controls.codigo.enable();
        this.form.reset();
        this.successMessage.set(isCreate ? 'Ubigeo creado correctamente.' : 'Ubigeo actualizado correctamente.');
        this.load();
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.resolveError(error)),
    });
  }

  protected askDelete(row: UbigeoRow): void {
    if (this.isSaving()) return;
    this.clearMessages();
    this.deleteTarget.set(row);
  }

  protected cancelDelete(): void {
    if (!this.isSaving()) this.deleteTarget.set(null);
  }

  protected confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target?.codigo || this.isSaving()) return;
    const request$ = this.level() === 'departamento' ? this.ubigeoService.deleteDepartamento(target.codigo)
      : this.level() === 'provincia' ? this.ubigeoService.deleteProvincia(target.codigo)
      : this.ubigeoService.deleteDistrito(target.codigo);
    this.isSaving.set(true);
    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.deleteTarget.set(null);
        this.successMessage.set('Ubigeo eliminado correctamente.');
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.deleteTarget.set(null);
        this.errorMessage.set(this.resolveError(error));
      },
    });
  }

  private configureForm(): void {
    this.form.controls.codigo_padre.setValidators(this.level() === 'departamento' ? [] : [Validators.required]);
    this.form.controls.codigo_padre.updateValueAndValidity();
  }

  private clearMessages(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  private resolveError(error: HttpErrorResponse): string {
    if (error.error === 'Departamento has associated provincias') return 'No se puede eliminar un departamento que tiene provincias asociadas.';
    if (error.error === 'Provincia has associated distritos') return 'No se puede eliminar una provincia que tiene distritos asociados.';
    if (typeof error.error === 'string' && error.error.trim()) return error.error;
    if (error.status === 0) return 'No se pudo conectar con el servidor. Verifica tu conexión.';
    return 'Ocurrió un error inesperado. Intenta nuevamente.';
  }
}
