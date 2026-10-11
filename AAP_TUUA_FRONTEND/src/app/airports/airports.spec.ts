import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { Airport } from '../models';
import { Airports } from './airports';

describe('Airports CRUD', () => {
  let component: Airports;
  let http: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/Airport`;
  const airport: Airport = {
    id: 'airport-id', name: 'Aeropuerto de prueba', iata_code: 'ABC', oaci_code: null,
    city: 'Lima', region: 'Lima', country_code: 'PE', ubigeo: null, latitude: null,
    longitude: null, elevation_m: null, elevation_f: null, timezone: null,
    airport_type: null, is_active: true, created_at: null, updated_at: null,
    created_by: null, modified_by: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    component = TestBed.runInInjectionContext(() => new Airports());
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('rejects invalid coordinate precision and elevation before sending a request', () => {
    component['startCreate']();
    component['form'].patchValue({ latitude: 1.1234567, elevation_m: 1.5 });
    component['submit']();
    expect(component['form'].invalid).toBe(true);
    expect(component['isSaving']()).toBe(false);
    http.expectNone(`${baseUrl}/Add`);
    component['form'].patchValue({
      latitude: -9999.999999, elevation_m: 0,
      name: 'Aeropuerto', city: 'Lima', region: 'Lima', country_code: 'PE',
    });
    expect(component['form'].valid).toBe(true);
  });

  it('requires name, city, region and country code before sending a request', () => {
    component['startCreate']();
    component['form'].patchValue({ name: '  ', city: '', region: '', country_code: '' });
    component['submit']();
    http.expectNone(`${baseUrl}/Add`);
    const { name, city, region, country_code, iata_code } = component['form'].controls;
    for (const control of [name, city, region, country_code]) {
      expect(control.hasError('required')).toBe(true);
      expect(control.touched).toBe(true);
    }
    expect(iata_code.valid).toBe(true);
    expect(component['mode']()).toBe('create');
  });

  it('updates an inactive airport without losing zero coordinates', () => {
    component['startEdit']({ ...airport, is_active: false, latitude: 0, elevation_m: 0 });
    component['form'].controls.is_active.setValue(true);
    component['submit']();
    const request = http.expectOne(`${baseUrl}/Update`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toMatchObject({ id: airport.id, latitude: 0, elevation_m: 0, is_active: true });
    request.flush(airport);
    http.expectOne(`${baseUrl}/GetAll`).flush([airport]);
    expect(component['mode']()).toBe('list');
    expect(component['isSaving']()).toBe(false);
  });

  it('shows unnamed records and refreshes after a logical deletion', () => {
    component['airports'].set([{ ...airport, name: null, iata_code: null }]);
    expect(component['filteredAirports']().length).toBe(1);
    component['askDelete'](airport);
    component['confirmDelete']();
    http.expectOne(`${baseUrl}/Delete/${airport.id}`).flush(null);
    http.expectOne(`${baseUrl}/GetAll`).flush([{ ...airport, is_active: false }]);
    expect(component['airports']()[0].is_active).toBe(false);
    expect(component['deleteTarget']()).toBeNull();
  });
});
