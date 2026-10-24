import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      {
        path: '',
        loadComponent: () => import('./home/home').then((m) => m.Home),
      },
      {
        path: 'users',
        loadComponent: () => import('./users/users').then((m) => m.Users),
      },
      {
        path: 'roles',
        loadComponent: () => import('./roles/roles').then((m) => m.Roles),
      },
      {
        path: 'roles/:roleId/resources',
        loadComponent: () =>
          import('./assign-resources/assign-resources').then((m) => m.AssignResources),
      },
      {
        path: 'features',
        loadComponent: () => import('./features/features').then((m) => m.Features),
      },
      {
        path: 'resources',
        loadComponent: () => import('./resources/resources').then((m) => m.Resources),
      },
      {
        path: 'airlines',
        loadComponent: () => import('./airlines/airlines').then((m) => m.Airlines),
      },
      {
        path: 'airports',
        loadComponent: () => import('./airports/airports').then((m) => m.Airports),
      },
      {
        path: 'airports/:airportId/terminals',
        loadComponent: () => import('./terminals/terminals').then((m) => m.Terminals),
      },
      {
        path: 'airports/:airportId/terminals/:terminalId/resources',
        loadComponent: () =>
          import('./airport-resources/airport-resources').then((m) => m.AirportResources),
      },
      {
        path: 'airports/:airportId/runways',
        loadComponent: () => import('./runways/runways').then((m) => m.Runways),
      },
      {
        path: 'locations',
        loadComponent: () => import('./locations/locations').then((m) => m.Locations),
      },
      {
        path: 'tuua_gates',
        loadComponent: () => import('./tuua-gates/tuua-gates').then((m) => m.TuuaGates),
      },
      {
        path: 'tuua_prices',
        loadComponent: () => import('./tuua-prices/tuua-prices').then((m) => m.TuuaPrices),
      },
      {
        path: 'cashier_machines',
        loadComponent: () =>
          import('./cashier-machines/cashier-machines').then((m) => m.CashierMachines),
      },
      {
        path: 'document_serial_groups',
        loadComponent: () =>
          import('./document-serial-groups/document-serial-groups').then((m) => m.DocumentSerialGroups),
      },
      {
        path: 'document_serial_groups/:groupId/sequential-numbers',
        loadComponent: () =>
          import('./document-sequential-numbers/document-sequential-numbers').then(
            (m) => m.DocumentSequentialNumbers,
          ),
      },
      {
        path: 'ubigeos',
        loadComponent: () => import('./ubigeos/ubigeos').then((m) => m.Ubigeos),
      },
    ],
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./login/login').then((m) => m.Login),
  },
  { path: '**', redirectTo: '' },
];
