import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { ActiveCashierSessionService } from '../services/active-cashier-session.service';

// Solo permite el acceso si el usuario tiene un turno de caja abierto; si no, lo lleva a abrir uno.
export const openSessionGuard: CanActivateFn = () => {
  const activeSession = inject(ActiveCashierSessionService);
  const router = inject(Router);

  return activeSession.getOpenSession().pipe(
    map((session) =>
      session ? true : router.createUrlTree(['/open_cashier_session'], { queryParams: { required: 1 } }),
    ),
    catchError(() => of(router.createUrlTree(['/']))),
  );
};
