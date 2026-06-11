import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  readonly navItems = [
    { path: '/ingreso', label: 'Registrar Ingreso', icon: '🚗' },
    { path: '/salida', label: 'Registrar Salida', icon: '🚪' },
    { path: '/activos', label: 'Vehículos Activos', icon: '📋' },
  ] as const;
}
