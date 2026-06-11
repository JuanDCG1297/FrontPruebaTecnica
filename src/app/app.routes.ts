// ========================================================================
// APP ROUTES (Definición de rutas)
// ========================================================================
// Acá se define la navegación de la aplicación.
// Angular usa un sistema de enrutamiento del lado del cliente:
//   • El usuario ve "cambiar de página" pero nunca recarga el navegador
//   • Es todo JavaScript — la app es una SPA (Single Page Application)
//
// Técnica clave: LAZY LOADING (carga perezosa)
//   • Los componentes NO se cargan al inicio
//   • Se cargan SOLO cuando el usuario navega a esa ruta
//   • Esto hace que la carga inicial sea más rápida (~84KB en lugar de ~300KB)
//   • Se ve en loadComponent: () => import('...').then(m => m.Componente)
//
// Formato de cada ruta:
//   {
//     path: 'ruta',              // URL relativa a la base
//     title: 'Título — App',     // El texto que aparece en la pestaña del navegador
//     loadComponent: () => ...   // Componente a cargar (lazy)
//   }
// ========================================================================

import { Routes } from '@angular/router';

/**
 * Definición de rutas de la aplicación.
 *
 * Orden de resolución:
 *   1. Angular busca la primera ruta que coincida con la URL actual
 *   2. Si no encuentra coincidencia, usa la ruta '**' (wildcard)
 *   3. Las rutas se evalúan en el orden en que aparecen acá
 */
export const routes: Routes = [
  // ── Ruta por defecto ──
  // Redirige al usuario automáticamente a /ingreso
  {
    path: '',
    redirectTo: 'ingreso',
    pathMatch: 'full', // Solo redirige si la URL es exactamente ''
  },

  // ── Registrar Ingreso ──
  // Formulario para registrar la entrada de un vehículo
  {
    path: 'ingreso',
    title: 'Registrar Ingreso — Parqueadero',
    loadComponent: () =>
      import('./features/vehicle-entry/vehicle-entry.component').then(
        (m) => m.VehicleEntryComponent
      ),
  },

  // ── Registrar Salida ──
  // Flujo de 2 pasos: buscar placa → confirmar salida
  {
    path: 'salida',
    title: 'Registrar Salida — Parqueadero',
    loadComponent: () =>
      import('./features/vehicle-exit/vehicle-exit.component').then(
        (m) => m.VehicleExitComponent
      ),
  },

  // ── Vehículos Activos ──
  // Lista de vehículos actualmente estacionados con actualización automática
  {
    path: 'activos',
    title: 'Vehículos Activos — Parqueadero',
    loadComponent: () =>
      import('./features/active-vehicles/active-vehicles.component').then(
        (m) => m.ActiveVehiclesComponent
      ),
  },

  // ── Ruta comodín (wildcard) ──
  // Cualquier URL que no coincida con las rutas anteriores
  // redirige a /ingreso
  {
    path: '**',
    redirectTo: 'ingreso',
  },
];
