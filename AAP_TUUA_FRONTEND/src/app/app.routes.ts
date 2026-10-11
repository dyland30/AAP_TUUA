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
        path: 'locations',
        loadComponent: () => import('./locations/locations').then((m) => m.Locations),
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
