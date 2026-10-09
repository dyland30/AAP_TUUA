import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthenticationResult, UserDto } from '../models';
import { clearStoredAuth, getStoredAuth, getToken, setStoredAuth } from './token-storage';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/Authentication`;

  authenticate(credentials: UserDto): Observable<AuthenticationResult> {
    return this.http
      .post<AuthenticationResult>(`${this.baseUrl}/authenticate`, credentials)
      .pipe(tap((result) => setStoredAuth(result)));
  }

  logout(): void {
    clearStoredAuth();
  }

  getToken(): string | null {
    return getToken();
  }

  getCurrentUser(): AuthenticationResult | null {
    return getStoredAuth();
  }

  isAuthenticated(): boolean {
    const token = getToken();
    if (!token) {
      return false;
    }

    const expiresAt = this.getTokenExpiry(token);
    if (expiresAt !== null && expiresAt <= Date.now()) {
      clearStoredAuth();
      return false;
    }

    return true;
  }

  private getTokenExpiry(token: string): number | null {
    try {
      const payload = token.split('.')[1];
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = JSON.parse(atob(normalized)) as { exp?: number };
      return typeof decoded.exp === 'number' ? decoded.exp * 1000 : null;
    } catch {
      return null;
    }
  }
}
