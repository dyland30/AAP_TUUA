import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatAutocompleteHarness } from '@angular/material/autocomplete/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogHarness } from '@angular/material/dialog/testing';
import { By } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { UbigeoSelector } from './ubigeo-selector';

@Component({
  imports: [ReactiveFormsModule, UbigeoSelector],
  template: '<app-ubigeo-selector [formControl]="ubigeo" />',
})
class SelectorHost {
  readonly ubigeo = new FormControl('010101', { nonNullable: true });
}

describe('UbigeoSelector', () => {
  let fixture: ComponentFixture<SelectorHost>;
  let http: HttpTestingController;
  let selector: UbigeoSelector;
  const baseUrl = `${environment.apiUrl}/Ubigeo`;
  const departamentos = [
    { codigo: '01', nombre: 'Amazonas' },
    { codigo: '02', nombre: 'Áncash' },
  ];
  const provincias = [
    { codigo: '0101', codigo_departamento: '01', nombre: 'Chachapoyas' },
    { codigo: '0201', codigo_departamento: '02', nombre: 'Huaraz' },
  ];
  const distritos = [
    { codigo: '010101', codigo_provincia: '0101', nombre: 'Chachapoyas' },
    { codigo: '020101', codigo_provincia: '0201', nombre: 'Huaraz' },
    { codigo: '020102', codigo_provincia: '0201', nombre: 'Independencia' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectorHost],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(SelectorHost);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    selector = fixture.debugElement.query(By.directive(UbigeoSelector)).componentInstance;
  });

  afterEach(() => {
    TestBed.inject(MatDialog).closeAll();
    http.verify();
  });

  function loadCatalogs(): void {
    http.expectOne(`${baseUrl}/GetAllDepartamentos`).flush(departamentos);
    http.expectOne(`${baseUrl}/GetAllProvincias`).flush(provincias);
    http.expectOne(`${baseUrl}/GetAllDistritos`).flush(distritos);
    fixture.detectChanges();
  }

  it('resolves an existing code after loading and displays the three hierarchy pills', () => {
    loadCatalogs();
    expect(fixture.componentInstance.ubigeo.value).toBe('010101');
    expect(selector['selectedDepartamento']()?.codigo).toBe('01');
    expect(selector['selectedProvincia']()?.codigo).toBe('0101');
    const pills = fixture.nativeElement.querySelectorAll('.ubigeo-selector__pill') as NodeListOf<HTMLElement>;
    expect(pills.length).toBe(3);
    expect(pills[0].textContent?.trim()).toBe('Amazonas');
    expect(pills[1].textContent?.trim()).toBe('Chachapoyas');
    expect(pills[2].textContent?.trim()).toBe('Chachapoyas');
    expect(fixture.nativeElement.querySelectorAll('.mat-mdc-autocomplete-trigger').length).toBe(0);
  });

  it('searches without accents, restricts the hierarchy and writes only the chosen district code', async () => {
    loadCatalogs();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const openButton = await loader.getHarness(MatButtonHarness.with({ text: /Seleccionar ubigeo/ }));
    await openButton.click();
    const rootLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);
    const dialog = await rootLoader.getHarness(MatDialogHarness);
    expect(await dialog.getTitleText()).toBe('Seleccionar ubigeo');
    const [departamento] = await dialog.getAllHarnesses(MatAutocompleteHarness);
    await departamento.clear();
    await departamento.enterText('ancash');
    expect(fixture.componentInstance.ubigeo.value).toBe('010101');
    const departmentOptions = await departamento.getOptions();
    expect(departmentOptions.length).toBe(1);
    expect(await departmentOptions[0].getText()).toContain('Áncash');
    await departamento.selectOption({ text: /02\s*·\s*Áncash/ });
    const autocompletes = await dialog.getAllHarnesses(MatAutocompleteHarness);
    await autocompletes[1].enterText('huar');
    expect((await autocompletes[1].getOptions()).length).toBe(1);
    await autocompletes[1].selectOption({ text: /0201\s*·\s*Huaraz/ });
    expect(fixture.componentInstance.ubigeo.value).toBe('010101');
    await autocompletes[2].enterText('inde');
    await autocompletes[2].selectOption({ text: /020102\s*·\s*Independencia/ });
    expect(fixture.componentInstance.ubigeo.value).toBe('010101');
    const confirm = await dialog.getHarness(MatButtonHarness.with({ text: /Seleccionar distrito/ }));
    const closed = firstValueFrom(TestBed.inject(MatDialog).openDialogs[0].afterClosed());
    await confirm.click();
    await closed;
    fixture.detectChanges();
    expect(fixture.componentInstance.ubigeo.value).toBe('020102');
    expect(selector['hierarchy']()?.departamento.nombre).toBe('Áncash');
    expect(fixture.nativeElement.querySelectorAll('.ubigeo-selector__pill').length).toBe(3);
    expect((await rootLoader.getAllHarnesses(MatDialogHarness)).length).toBe(0);
  });

  it('clears draft descendants when changing a parent and keeps the saved code on cancel', async () => {
    loadCatalogs();
    selector['openDialog']();
    fixture.detectChanges();
    selector['provinciaControl'].setValue('Buscar otra provincia');
    fixture.detectChanges();
    expect(fixture.componentInstance.ubigeo.value).toBe('010101');
    expect(selector['selectedDistrito']()).toBeNull();
    expect(selector['distritoControl'].disabled).toBe(true);
    selector['departamentoControl'].setValue('Otro departamento');
    fixture.detectChanges();
    expect(selector['provinciaControl'].disabled).toBe(true);
    expect(selector['hierarchy']()?.distrito.codigo).toBe('010101');
    const rootLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);
    const dialog = await rootLoader.getHarness(MatDialogHarness);
    const confirm = await dialog.getHarness(MatButtonHarness.with({ text: /Seleccionar distrito/ }));
    expect(await confirm.isDisabled()).toBe(true);
    const cancel = await dialog.getHarness(MatButtonHarness.with({ text: 'Cancelar' }));
    const closed = firstValueFrom(TestBed.inject(MatDialog).openDialogs[0].afterClosed());
    await cancel.click();
    await closed;
    fixture.detectChanges();
    expect(fixture.componentInstance.ubigeo.value).toBe('010101');
    expect(selector['selectedDepartamento']()?.codigo).toBe('01');
    expect(selector['selectedProvincia']()?.codigo).toBe('0101');
  });

  it('does not change the saved code when dismissing the dialog with Escape', async () => {
    loadCatalogs();
    selector['openDialog']();
    fixture.detectChanges();
    selector['departamentoControl'].setValue(departamentos[1]);
    const rootLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);
    const dialog = await rootLoader.getHarness(MatDialogHarness);
    const closed = firstValueFrom(TestBed.inject(MatDialog).openDialogs[0].afterClosed());
    await dialog.close();
    await closed;
    fixture.detectChanges();
    expect(fixture.componentInstance.ubigeo.value).toBe('010101');
    expect(selector['selectedDistrito']()?.codigo).toBe('010101');
  });

  it('resolves manual codes, replaces existing values on form reset and clears unknown-code pills', () => {
    loadCatalogs();
    selector['codeControl'].setValue('020101');
    expect(fixture.componentInstance.ubigeo.value).toBe('020101');
    expect(selector['hierarchy']()?.provincia.nombre).toBe('Huaraz');
    fixture.componentInstance.ubigeo.reset('010101');
    fixture.detectChanges();
    expect(selector['codeControl'].value).toBe('010101');
    expect(selector['hierarchy']()?.departamento.nombre).toBe('Amazonas');
    selector['codeControl'].setValue('999999');
    fixture.detectChanges();
    expect(selector['hierarchy']()).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.ubigeo-selector__pill').length).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('No se encontró la jerarquía');
    selector['clear']();
    expect(fixture.componentInstance.ubigeo.value).toBe('');
    expect(selector['departamentoControl'].value).toBeNull();
  });

  it('preserves existing codes on load errors and resolves them when retrying', () => {
    http.expectOne(`${baseUrl}/GetAllProvincias`).flush('Unavailable', { status: 500, statusText: 'Error' });
    const otherRequests = http.match((request) => request.url.startsWith(baseUrl));
    expect(otherRequests.every((request) => request.cancelled)).toBe(true);
    fixture.detectChanges();
    expect(fixture.componentInstance.ubigeo.value).toBe('010101');
    expect(selector['errorMessage']()).toContain('No se pudieron cargar');
    selector['load']();
    loadCatalogs();
    expect(selector['hierarchy']()?.distrito.codigo).toBe('010101');
    expect(selector['errorMessage']()).toBeNull();
  });

  it('disables the field and dialog button through the parent form and marks selections as touched', async () => {
    loadCatalogs();
    fixture.componentInstance.ubigeo.disable();
    fixture.detectChanges();
    expect(selector['codeControl'].disabled).toBe(true);
    expect(selector['departamentoControl'].disabled).toBe(true);
    expect(selector['provinciaControl'].disabled).toBe(true);
    expect(selector['distritoControl'].disabled).toBe(true);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const openButton = await loader.getHarness(MatButtonHarness.with({ text: /Seleccionar ubigeo/ }));
    expect(await openButton.isDisabled()).toBe(true);
    selector['openDialog']();
    expect(TestBed.inject(MatDialog).openDialogs.length).toBe(0);
    fixture.componentInstance.ubigeo.enable();
    fixture.detectChanges();
    selector['clear']();
    expect(fixture.componentInstance.ubigeo.touched).toBe(true);
  });

  it('shows the parent required error on the field once the control is touched', () => {
    loadCatalogs();
    const control = fixture.componentInstance.ubigeo;
    control.addValidators(Validators.required);
    selector['clear']();
    control.updateValueAndValidity();
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.required).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('El ubigeo es obligatorio.');
  });
});
