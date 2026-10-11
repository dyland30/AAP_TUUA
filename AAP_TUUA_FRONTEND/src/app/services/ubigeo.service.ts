import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { UbigeoDepartamento, UbigeoDistrito, UbigeoProvincia } from '../models';

@Injectable({ providedIn: 'root' })
export class UbigeoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/Ubigeo`;

  getAllDepartamentos(): Observable<UbigeoDepartamento[]> {
    return this.http.get<UbigeoDepartamento[]>(`${this.baseUrl}/GetAllDepartamentos`);
  }

  getDepartamentoByCodigo(codigo: string): Observable<UbigeoDepartamento | null> {
    return this.http.get<UbigeoDepartamento | null>(
      `${this.baseUrl}/GetDepartamentoByCodigo/${encodeURIComponent(codigo)}`,
    );
  }

  addDepartamento(departamento: UbigeoDepartamento): Observable<UbigeoDepartamento> {
    return this.http.post<UbigeoDepartamento>(`${this.baseUrl}/AddDepartamento`, departamento);
  }

  updateDepartamento(departamento: UbigeoDepartamento): Observable<UbigeoDepartamento> {
    return this.http.put<UbigeoDepartamento>(`${this.baseUrl}/UpdateDepartamento`, departamento);
  }

  deleteDepartamento(codigo: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/DeleteDepartamento/${encodeURIComponent(codigo)}`,
    );
  }

  getAllProvincias(): Observable<UbigeoProvincia[]> {
    return this.http.get<UbigeoProvincia[]>(`${this.baseUrl}/GetAllProvincias`);
  }

  getProvinciaByCodigo(codigo: string): Observable<UbigeoProvincia | null> {
    return this.http.get<UbigeoProvincia | null>(
      `${this.baseUrl}/GetProvinciaByCodigo/${encodeURIComponent(codigo)}`,
    );
  }

  getProvinciasByDepartamento(codigoDepartamento: string): Observable<UbigeoProvincia[]> {
    return this.http.get<UbigeoProvincia[]>(
      `${this.baseUrl}/GetProvinciasByDepartamento/${encodeURIComponent(codigoDepartamento)}`,
    );
  }

  addProvincia(provincia: UbigeoProvincia): Observable<UbigeoProvincia> {
    return this.http.post<UbigeoProvincia>(`${this.baseUrl}/AddProvincia`, provincia);
  }

  updateProvincia(provincia: UbigeoProvincia): Observable<UbigeoProvincia> {
    return this.http.put<UbigeoProvincia>(`${this.baseUrl}/UpdateProvincia`, provincia);
  }

  deleteProvincia(codigo: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/DeleteProvincia/${encodeURIComponent(codigo)}`);
  }

  getAllDistritos(): Observable<UbigeoDistrito[]> {
    return this.http.get<UbigeoDistrito[]>(`${this.baseUrl}/GetAllDistritos`);
  }

  getDistritoByCodigo(codigo: string): Observable<UbigeoDistrito | null> {
    return this.http.get<UbigeoDistrito | null>(
      `${this.baseUrl}/GetDistritoByCodigo/${encodeURIComponent(codigo)}`,
    );
  }

  getDistritosByProvincia(codigoProvincia: string): Observable<UbigeoDistrito[]> {
    return this.http.get<UbigeoDistrito[]>(
      `${this.baseUrl}/GetDistritosByProvincia/${encodeURIComponent(codigoProvincia)}`,
    );
  }

  addDistrito(distrito: UbigeoDistrito): Observable<UbigeoDistrito> {
    return this.http.post<UbigeoDistrito>(`${this.baseUrl}/AddDistrito`, distrito);
  }

  updateDistrito(distrito: UbigeoDistrito): Observable<UbigeoDistrito> {
    return this.http.put<UbigeoDistrito>(`${this.baseUrl}/UpdateDistrito`, distrito);
  }

  deleteDistrito(codigo: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/DeleteDistrito/${encodeURIComponent(codigo)}`);
  }
}
