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
  private redirectHandled = false;

  async login(): Promise<void> {
    const client = await this.getClient();
    this.clearStaleInteraction();
    try {
      await client.loginRedirect({ scopes: [environment.entra.apiScope], prompt: 'select_account' });
    } catch (error) {
      if (!this.isInteractionInProgress(error)) {
        throw error;
      }
      // Reintento único: el flag pudo reaparecer entre la limpieza y la llamada.
      this.clearStaleInteraction();
      await client.loginRedirect({ scopes: [environment.entra.apiScope], prompt: 'select_account' });
    }
  }

  /**
   * MSAL guarda `msal.interaction.status` en sessionStorage al iniciar un redirect y solo lo borra
   * al completar handleRedirectPromise. Si el usuario vuelve atrás desde Entra ID, cierra el login
   * o se interrumpe el flujo, el flag queda huérfano en esa pestaña/perfil y todo nuevo intento falla
   * con `interaction_in_progress`. Al pulsar el botón en /login no hay ninguna interacción activa
   * (el redirect de vuelta ya se procesó en ngOnInit), por lo que es seguro descartarlo.
   */
  private clearStaleInteraction(): void {
    const key = 'msal.interaction.status';
    try {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    } catch {
      // Almacenamiento no disponible: MSAL gestionará el error por su cuenta.
    }
  }

  private isInteractionInProgress(error: unknown): boolean {
    return (error as { errorCode?: string } | null)?.errorCode === 'interaction_in_progress';
  }

  /**
   * Procesa la respuesta del redirect de Entra ID; devuelve el access token o null.
   * MSAL cachea el resultado de handleRedirectPromise durante la vida de la página, por lo que
   * solo se consume una vez: de lo contrario, volver a /login tras el logout reautenticaría al usuario.
   */
  async handleRedirect(): Promise<string | null> {
    if (this.redirectHandled) {
      return null;
    }
    this.redirectHandled = true;
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
