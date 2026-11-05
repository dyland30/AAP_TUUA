import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { CashierMachineSession, Feature } from '../models';
import { AuthenticationService } from './authentication.service';
import { CashierMachineSessionService } from './cashier-machine-session.service';
import { FeatureService } from './feature.service';

const SESSION_STATUS_GROUP = 'Estados Turno Caja';
const OPEN_STATUS = 'abierto';

function normalize(value: string | null): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase();
}

@Injectable({ providedIn: 'root' })
export class ActiveCashierSessionService {
  private readonly auth = inject(AuthenticationService);
  private readonly featureService = inject(FeatureService);
  private readonly sessionService = inject(CashierMachineSessionService);

  /**
   * Turno abierto del usuario autenticado: estado "Abierto", activo y sin hora de cierre.
   * Devuelve null si no tiene ninguno (o si el estado "Abierto" no existe en el catálogo).
   */
  getOpenSession(): Observable<CashierMachineSession | null> {
    const userId = this.auth.getCurrentUser()?.user_id;
    if (!userId) return of(null);

    return forkJoin({
      openStatusId: this.getOpenStatusId(),
      sessions: this.sessionService.getByLocalUserId(userId),
    }).pipe(
      map(({ openStatusId, sessions }) => {
        if (openStatusId === null) return null;
        const open = (sessions ?? []).filter(
          (session) => session.is_active && !session.end_time && session.status_id === openStatusId,
        );
        open.sort((a, b) => b.start_time.localeCompare(a.start_time));
        return open[0] ?? null;
      }),
    );
  }

  private getOpenStatusId(): Observable<number | null> {
    return this.featureService.getAllFeatureGroups().pipe(
      map((groups) =>
        (groups ?? []).find((group) => normalize(group.name) === normalize(SESSION_STATUS_GROUP)),
      ),
      switchMap((group) =>
        group ? this.featureService.getFeaturesByGroup(group.id) : of<Feature[]>([]),
      ),
      map(
        (features) =>
          (features ?? []).find(
            (feature) =>
              feature.is_active &&
              [feature.description, feature.feature_value].some(
                (value) => normalize(value) === OPEN_STATUS,
              ),
          )?.id ?? null,
      ),
    );
  }
}
