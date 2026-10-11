import { Injectable } from '@angular/core';
import type { PublicClientApplication } from '@azure/msal-browser';
import { environment } from '../../environments/environment';

/**
 * Autenticación con Entra ID. Solo se usa para obtener un access token que el backend
 * canjea por el JWT propio de la aplicación; los roles se gestionan en TUUA.
 */
@Injectable({ providedIn: 'root' })
export class EntraAuthService {
  private client: Promise<PublicClientApplication> | null = null;

  async login(): Promise<void> {
    const client = await this.getClient();
    await client.loginRedirect({ scopes: [environment.entra.apiScope], prompt: 'select_account' });
  }

  /** Procesa la respuesta del redirect de Entra ID; devuelve el access token o null. */
  async handleRedirect(): Promise<string | null> {
    const client = await this.getClient();
    const result = await client.handleRedirectPromise();
    return result?.accessToken ?? null;
  }

  /** Limpia la caché local de MSAL sin cerrar la sesión corporativa global. */
  async clearSession(): Promise<void> {
    const client = await this.getClient();
    await client.clearCache();
  }

  private getClient(): Promise<PublicClientApplication> {
    // MSAL se carga de forma diferida para no inflar el bundle inicial.
    this.client ??= (async () => {
      const { BrowserCacheLocation, PublicClientApplication } = await import('@azure/msal-browser');
      const client = new PublicClientApplication({
        auth: {
          clientId: environment.entra.clientId,
          authority: `https://login.microsoftonline.com/${environment.entra.tenantId}`,
          redirectUri: `${window.location.origin}/login`,
          postLogoutRedirectUri: `${window.location.origin}/login`,
        },
        cache: { cacheLocation: BrowserCacheLocation.SessionStorage },
      });
      await client.initialize();
      return client;
    })();
    return this.client;
  }
}
