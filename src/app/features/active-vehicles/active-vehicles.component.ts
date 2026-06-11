// ========================================================================
// ACTIVE VEHICLES COMPONENT (Vehículos Activos)
// ========================================================================
// Este componente muestra la lista de vehículos actualmente estacionados
// en el parqueadero.
//
// Características clave:
//   1. Auto-refresh cada 30 segundos (Polling)
//       • Llama a GET /api/Vehicles/active cada 30s automáticamente
//       • No necesita que el usuario recargue la página
//       • Ideal para una pantalla tipo "monitor" o dashboard
//
//   2. Manejo de cooldown
//       • El botón de recarga manual se deshabilita por 3 segundos
//       • Evita que el usuario haga spam de requests
//
//   3. Estados: loading, empty, error, data
//       • loading → spinner mientras carga
//       • empty → mensaje "no hay vehículos" (con icono)
//       • error → alerta roja con mensaje
//       • data → tabla de vehículos
//
// ¿Por qué polling y no WebSockets?
//   Porque la API REST es simple y no necesitamos actualizaciones
//   en tiempo real. 30 segundos es suficiente para este caso de uso.
//   Si necesitáramos actualización instantánea, usaríamos SignalR
//   (WebSockets) en el backend.
// ========================================================================

import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VehicleService, ApiError } from '../../core/services/vehicle.service';
import { VehicleResponse } from '../../core/models/vehicle.models';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-active-vehicles',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './active-vehicles.component.html',
  styleUrls: ['./active-vehicles.component.css'],
})
export class ActiveVehiclesComponent implements OnInit, OnDestroy {
  // ──────────────────────────────────────────────────────────────────────
  // Propiedades
  // ──────────────────────────────────────────────────────────────────────

  /** Lista de vehículos activos */
  vehicles: VehicleResponse[] = [];

  /** Indicador de carga */
  loading = false;

  /** Error de la última petición */
  error: ApiError | null = null;

  /**
   * Suscripción al intervalo de auto-refresh.
   * Se guarda para poder cancelarla en ngOnDestroy().
   * Si no la cancelamos, el componente seguiría haciendo peticiones
   * aunque el usuario ya navegó a otra ruta (memory leak).
   */
  private refreshSubscription?: Subscription;

  /**
   * Cooldown para el botón de recarga manual.
   * Evita que el usuario haga spam de requests.
   *
   * true → botón deshabilitado (esperar 3s)
   * false → botón habilitado
   */
  cooldown = false;

  // ──────────────────────────────────────────────────────────────────────
  // Constructor
  // ──────────────────────────────────────────────────────────────────────

  constructor(private readonly vehicleService: VehicleService) {}

  // ──────────────────────────────────────────────────────────────────────
  // Lifecycle Hooks (Ciclo de vida)
  // ──────────────────────────────────────────────────────────────────────

  /**
   * ngOnInit(): Se ejecuta UNA vez cuando el componente se inicializa.
   *
   * 1. Carga inicial de datos (para que la tabla no esté vacía al entrar)
   * 2. Inicia el auto-refresh cada 30 segundos
   *
   * Es como el "constructor" de la lógica del componente.
   */
  ngOnInit(): void {
    this.loadVehicles();
    this.startAutoRefresh();
  }

  /**
   * ngOnDestroy(): Se ejecuta cuando el componente se destruye.
   *
   * Es decir, cuando el usuario navega a otra ruta y Angular
   * elimina este componente del DOM.
   *
   * Acá cancelamos la suscripción al auto-refresh para evitar:
   *   • Memory leaks (la suscripción sigue activa)
   *   • Llamadas HTTP después de que el componente ya no existe
   */
  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  // ──────────────────────────────────────────────────────────────────────
  // Métodos públicos
  // ──────────────────────────────────────────────────────────────────────

  /**
   * loadVehicles(): Obtiene la lista de vehículos activos de la API.
   *
   * Se llama desde:
   *   • ngOnInit() → carga inicial
   *   • El intervalo de auto-refresh → cada 30s
   *   • El botón "Recargar" → manualmente
   */
  loadVehicles(): void {
    this.error = null;
    this.loading = true;

    this.vehicleService.getActiveVehicles().subscribe({
      next: (data) => {
        this.vehicles = data;
        this.loading = false;
      },
      error: (err: ApiError) => {
        this.error = err;
        this.loading = false;
      },
    });
  }

  /**
   * refresh(): Recarga manual con cooldown de 3 segundos.
   *
   * El cooldown evita que el usuario haga clic varias veces
   * y sature la API con requests innecesarios.
   */
  refresh(): void {
    if (this.cooldown) return; // Si está en cooldown, ignorar

    this.loadVehicles();
    this.startCooldown();
  }

  /**
   * getTimeDiff(): Calcula la diferencia entre entryTime y ahora.
   *
   * Se usa en el template para mostrar cuánto tiempo lleva estacionado
   * cada vehículo.
   *
   * @param entryTime - Fecha/hora ISO de ingreso
   * @returns Objeto con horas y minutos
   */
  getTimeDiff(entryTime: string): { hours: number; minutes: number } {
    const entry = new Date(entryTime);
    const now = new Date();
    const diffMs = now.getTime() - entry.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    return {
      hours: Math.floor(diffMinutes / 60),
      minutes: diffMinutes % 60,
    };
  }

  // ──────────────────────────────────────────────────────────────────────
  // Métodos privados
  // ──────────────────────────────────────────────────────────────────────

  /**
   * startAutoRefresh(): Inicia el polling cada 30 segundos.
   *
   * ¿Cómo funciona?
   *   • interval(30000) → emite un valor cada 30000ms (30s)
   *   • switchMap → cancela la petición anterior si no terminó y
   *     llama a getActiveVehicles()
   *   • subscribe → procesa la respuesta
   *
   * ¿Por qué switchMap y no mergeMap?
   *   Si la petición anterior tarda más de 30s (ej: red lenta),
   *   switchMap cancela la anterior y empieza una nueva. Así evitamos
   *   requests acumuladas.
   */
  private startAutoRefresh(): void {
    this.refreshSubscription = interval(30000)
      .pipe(switchMap(() => this.vehicleService.getActiveVehicles()))
      .subscribe({
        next: (data) => {
          this.vehicles = data;
        },
        error: () => {
          // En auto-refresh, los errores son silenciosos para no
          // molestar al usuario con alertas cada 30 segundos.
          // Si hay error, mantenemos la lista anterior.
        },
      });
  }

  /**
   * stopAutoRefresh(): Cancela la suscripción al intervalo.
   *
   * Se llama en ngOnDestroy() para limpiar recursos.
   */
  private stopAutoRefresh(): void {
    this.refreshSubscription?.unsubscribe();
  }

  /**
   * startCooldown(): Activa el cooldown por 3 segundos.
   *
   * Después de 3s, el botón de recarga manual vuelve a estar disponible.
   */
  private startCooldown(): void {
    this.cooldown = true;
    setTimeout(() => {
      this.cooldown = false;
    }, 3000);
  }
}
