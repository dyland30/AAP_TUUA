import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { Ubigeos } from './ubigeos';

describe('Ubigeos CRUD', () => {
  let component: Ubigeos;
  let http: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/Ubigeo`;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    component = TestBed.runInInjectionContext(() => new Ubigeos());
    http = TestBed.inject(HttpTestingController);
    component['departamentos'].set([{ codigo: '01', nombre: 'Amazonas' }, { codigo: '02', nombre: 'Áncash' }]);
    component['provincias'].set([
      { codigo: '0101', codigo_departamento: '01', nombre: 'Chachapoyas' },
      { codigo: '0201', codigo_departamento: '02', nombre: 'Huaraz' },
    ]);
    component['distritos'].set([
      { codigo: '010101', codigo_provincia: '0101', nombre: 'Chachapoyas' },
      { codigo: '020101', codigo_provincia: '0201', nombre: 'Huaraz' },
    ]);
  });

  afterEach(() => http.verify());

  it('filters districts through their province and clears dependent filters and pagination', () => {
    component['selectLevel']('distrito');
    component['selectProvincia']('0201');
    component['pageIndex'].set(3);
    component['selectDepartamento']('01');
    expect(component['selectedProvincia']()).toBeNull();
    expect(component['pageIndex']()).toBe(0);
    expect(component['filteredRows']().map((item) => item.codigo)).toEqual(['010101']);
  });

  it('requires a parent for provinces but not for departments', () => {
    component['selectLevel']('provincia');
    component['startCreate']();
    component['form'].patchValue({ codigo: '0102', nombre: 'Bagua' });
    component['submit']();
    expect(component['form'].controls.codigo_padre.hasError('required')).toBe(true);
    http.expectNone(`${baseUrl}/AddProvincia`);
    component['selectLevel']('departamento');
    component['startCreate']();
    component['form'].patchValue({ codigo: '03', nombre: 'Apurímac' });
    expect(component['form'].valid).toBe(true);
  });

  it('keeps the district primary key and leading zeroes in an update', () => {
    component['selectLevel']('distrito');
    component['startEdit']({ codigo: '010101', nombre: 'Chachapoyas', codigo_padre: '0101' });
    expect(component['form'].controls.codigo.disabled).toBe(true);
    component['submit']();
    const request = http.expectOne(`${baseUrl}/UpdateDistrito`);
    expect(request.request.body).toEqual({ codigo: '010101', nombre: 'Chachapoyas', codigo_provincia: '0101' });
    request.flush(request.request.body);
    http.expectOne(`${baseUrl}/GetAllDepartamentos`).flush([]);
    http.expectOne(`${baseUrl}/GetAllProvincias`).flush([]);
    http.expectOne(`${baseUrl}/GetAllDistritos`).flush([]);
    expect(component['form'].controls.codigo.enabled).toBe(true);
    expect(component['mode']()).toBe('list');
  });

  it('shows the hierarchy deletion error without removing existing rows', () => {
    component['askDelete']({ codigo: '01', nombre: 'Amazonas', codigo_padre: null });
    component['confirmDelete']();
    http.expectOne(`${baseUrl}/DeleteDepartamento/01`).flush('Departamento has associated provincias',
      { status: 500, statusText: 'Error' });
    expect(component['errorMessage']()).toContain('provincias asociadas');
    expect(component['departamentos']().length).toBe(2);
    expect(component['isSaving']()).toBe(false);
    expect(component['deleteTarget']()).toBeNull();
  });
});
