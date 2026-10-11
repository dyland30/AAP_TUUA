import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { Locations } from './locations';

describe('Locations CRUD', () => {
  let component: Locations;
  let http: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/Location`;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    component = TestBed.runInInjectionContext(() => new Locations());
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('prefills the airport filter on creation and trims the payload', () => {
    component['selectedAirportId'].set('airport-id');
    component['startCreate']();
    expect(component['form'].controls.airport_id.value).toBe('airport-id');
    component['form'].patchValue({ name: ' Sede central ', ubigeo: '010101' });
    component['submit']();
    const request = http.expectOne(`${baseUrl}/Add`);
    expect(request.request.body).toMatchObject({ airport_id: 'airport-id', name: 'Sede central', ubigeo: '010101' });
    request.flush({ ...request.request.body, id: 'location-id' });
    http.expectOne(`${baseUrl}/GetAll`).flush([]);
    http.expectOne(`${environment.apiUrl}/Airport/GetAll`).flush([]);
    expect(component['mode']()).toBe('list');
  });

  it('requires name, airport and ubigeo before sending the request', () => {
    component['startCreate']();
    component['form'].patchValue({ airport_id: null, name: '   ', ubigeo: '' });
    component['submit']();
    http.expectNone(`${baseUrl}/Add`);
    const { name, airport_id, ubigeo } = component['form'].controls;
    expect(name.hasError('required')).toBe(true);
    expect(airport_id.hasError('required')).toBe(true);
    expect(ubigeo.hasError('required')).toBe(true);
    expect(name.touched && airport_id.touched && ubigeo.touched).toBe(true);
    expect(component['mode']()).toBe('create');
  });

  it('combines the airport filter and text search', () => {
    component['locations'].set([
      { id: '1', airport_id: 'a', name: 'Terminal norte', description: null, ubigeo: null },
      { id: '2', airport_id: 'b', name: 'Terminal norte', description: null, ubigeo: null },
      { id: '3', airport_id: 'a', name: 'Terminal sur', description: null, ubigeo: null },
    ]);
    component['selectedAirportId'].set('a');
    component['search'].set('NORTE');
    expect(component['filteredLocations']().map((item) => item.id)).toEqual(['1']);
  });

  it('retains the edit form and releases the saving state on server errors', () => {
    component['startEdit']({ id: '1', airport_id: 'a', name: 'Sede', description: null, ubigeo: '010101' });
    component['submit']();
    http.expectOne(`${baseUrl}/Update`).flush('Location not found', { status: 500, statusText: 'Error' });
    expect(component['mode']()).toBe('edit');
    expect(component['isSaving']()).toBe(false);
    expect(component['errorMessage']()).toBe('Location not found');
  });
});
