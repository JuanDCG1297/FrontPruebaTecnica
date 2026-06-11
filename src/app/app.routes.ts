import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'ingreso',
    pathMatch: 'full',
  },
  {
    path: 'ingreso',
    title: 'Registrar Ingreso — Parqueadero',
    loadComponent: () =>
      import('./features/vehicle-entry/vehicle-entry.component').then(
        (m) => m.VehicleEntryComponent
      ),
  },
  {
    path: 'salida',
    title: 'Registrar Salida — Parqueadero',
    loadComponent: () =>
      import('./features/vehicle-exit/vehicle-exit.component').then(
        (m) => m.VehicleExitComponent
      ),
  },
  {
    path: 'activos',
    title: 'Vehículos Activos — Parqueadero',
    loadComponent: () =>
      import('./features/active-vehicles/active-vehicles.component').then(
        (m) => m.ActiveVehiclesComponent
      ),
  },
  {
    path: '**',
    redirectTo: 'ingreso',
  },
];
