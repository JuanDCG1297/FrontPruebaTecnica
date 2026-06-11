// ========================================================================
// APP COMPONENT (Componente Raíz)
// ========================================================================
// Este es el componente RAÍZ de la aplicación. Es el que Angular
// renderiza cuando arranca la app (se usa en index.html como <app-root>).
//
// Responsabilidades:
//   1. Definir el layout principal (shell): sidebar + contenido
//   2. Proveer la navegación entre las secciones
//   3. Renderizar los componentes hijos mediante <router-outlet>
//
// Patrón: Shell Component
//   El AppComponent es un "shell" o "layout component". No tiene lógica
//   de negocio propia. Solo define la estructura visual y la navegación.
//   Los componentes hijos (VehicleEntry, VehicleExit, ActiveVehicles)
//   se renderizan dentro del <router-outlet>.
//
// RouterLink vs RouterLinkActive:
//   • RouterLink → directiva para navegar sin recargar la página
//   • RouterLinkActive → agrega una clase CSS cuando la ruta está activa
// ========================================================================

import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,

  /**
   * imports necesarios para el template:
   *   • RouterOutlet → renderiza el componente de la ruta activa
   *   • RouterLink → directiva [routerLink] para navegación
   *   • RouterLinkActive → directiva routerLinkActive para estilos
   *
   * NOTA: No se importa CommonModule porque no usamos @if/@for
   * acá. El @for del template usa la lista navItems que es estática.
   * Si necesitáramos pipes (date, number), habría que importarlo.
   */
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  /**
   * Items de navegación del sidebar.
   *
   * readonly → no se puede reasignar (inmutabilidad)
   * as const → TypeScript trata los strings como literales exactos
   *
   * Cada item tiene:
   *   • path → ruta Angular (coincide con app.routes.ts)
   *   • label → texto visible para el usuario
   *   • icon → emoji decorativo
   */
  readonly navItems = [
    { path: '/ingreso', label: 'Registrar Ingreso', icon: '🚗' },
    { path: '/salida', label: 'Registrar Salida', icon: '🚪' },
    { path: '/activos', label: 'Vehículos Activos', icon: '📋' },
  ] as const;
}
