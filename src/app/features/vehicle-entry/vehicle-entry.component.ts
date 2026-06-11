// ========================================================================
// VEHICLE ENTRY COMPONENT (Registrar Ingreso)
// ========================================================================
// Este componente maneja el formulario de INGRESO de vehículos.
// Es el más simple de los tres: un formulario con placa + tipo, y un
// solo llamado a la API.
//
// Flujo:
//   1. Usuario completa el formulario (placa + tipo)
//   2. Validación del lado del cliente (placa requerida, alfanumérica)
//   3. POST /api/Vehicles/entry
//   4. Éxito → muestra mensaje verde con datos del ingreso
//   5. Error → muestra mensaje rojo con descripción del problema
//
// Conceptos Angular que tenés que entender:
//
// • Standalone component (@Component({ standalone: true }))
//   No necesita un NgModule para existir. Se importa solo.
//
// • FormsModule + [(ngModel)]
//   Two-way data binding: el input y la propiedad del componente
//   están sincronizados. Si cambia uno, cambia el otro.
//
// • @if / @for (Angular 17+ @control flow)
//   Reemplazan *ngIf y *ngFor. Son más rápidos y legibles.
//
// • Observable.subscribe()
//   Los métodos del servicio devuelven Observables (rxjs).
//   .subscribe() es como "ejecutar" la llamada HTTP.
//   next = éxito, error = falló.
// ========================================================================

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VehicleService, ApiError } from '../../core/services/vehicle.service';
import {
  VEHICLE_TYPES,
  VehicleType,
  EntryResponse,
} from '../../core/models/vehicle.models';

@Component({
  // ── Metadatos del componente ──

  /**
   * Selector CSS para usar este componente.
   * En HTML se usa como <app-vehicle-entry></app-vehicle-entry>
   */
  selector: 'app-vehicle-entry',

  /**
   * Standalone = true significa que este componente NO necesita
   * estar declarado en un NgModule. Puede importarse solo.
   */
  standalone: true,

  /**
   * imports: Los módulos/componentes que necesita este componente.
   * • CommonModule → directivas básicas (@if, @for, date pipe, etc.)
   * • FormsModule → [(ngModel)] para two-way binding
   */
  imports: [CommonModule, FormsModule],

  /**
   * templateUrl y styleUrls: Archivos de template y estilos.
   * Separa la lógica (TypeScript) de la presentación (HTML) y el
   * diseño (CSS). Es el patrón correcto.
   */
  templateUrl: './vehicle-entry.component.html',
  styleUrls: ['./vehicle-entry.component.css'],
})
export class VehicleEntryComponent {
  // ──────────────────────────────────────────────────────────────────────
  // Propiedades públicas (se usan en el template)
  // ──────────────────────────────────────────────────────────────────────

  /**
   * Lista de tipos de vehículo.
   * readonly → no se puede reasignar después de la inicialización.
   * Se usa en el <select> del template con @for.
   */
  readonly vehicleTypes = VEHICLE_TYPES;

  /**
   * Modelo del formulario (two-way binding con [(ngModel)]).
   * • plate → se actualiza cuando el usuario escribe en el input
   * • vehicleType → se actualiza cuando el usuario selecciona del <select>
   */
  plate = '';
  vehicleType: VehicleType = 'Carro';

  /**
   * Estados de la UI.
   * • loading → true mientras se espera la respuesta de la API
   * • success → datos de la respuesta cuando el ingreso es exitoso
   * • error → error cuando la API falla o la validación falla
   */
  loading = false;
  success: EntryResponse | null = null;
  error: ApiError | null = null;

  // ──────────────────────────────────────────────────────────────────────
  // Constructor
  // ──────────────────────────────────────────────────────────────────────

  /**
   * @param vehicleService - Servicio de vehículos (inyectado por DI)
   *
   * Angular inyecta automáticamente el VehicleService porque:
   * 1. Está marcado con @Injectable({ providedIn: 'root' })
   * 2. Lo pedimos en el constructor
   *
   * Es lo mismo que hacer: const service = new VehicleService(httpClient)
   * pero Angular lo hace por nosotros y nos asegura que sea singleton.
   */
  constructor(private readonly vehicleService: VehicleService) {}

  // ──────────────────────────────────────────────────────────────────────
  // Métodos
  // ──────────────────────────────────────────────────────────────────────

  /**
   * onSubmit(): Se ejecuta cuando el usuario envía el formulario.
   *
   * Flujo completo:
   *   1. Limpiar estados anteriores (success, error)
   *   2. Validar placa del lado del cliente (antes de llamar a la API)
   *   3. Si la validación falla → mostrar error sin llamar a la API
   *   4. Si la validación pasa → llamar a registerEntry()
   *   5. Suscribirse al Observable:
   *      • next: ingreso exitoso → mostrar success
   *      • error: falló → mostrar error
   *
   * ¿Por qué validar del lado del cliente?
   *   El backend también valida (FluentValidation). Pero validar
   *   antes de enviar evita llamadas HTTP innecesarias y da feedback
   *   instantáneo al usuario. Es "defensa en profundidad".
   */
  onSubmit(): void {
    // Resetear estados previos
    this.success = null;
    this.error = null;

    // ── Validación de placa ──
    const plateClean = this.plate.toUpperCase().trim();

    // Requerida
    if (!plateClean) {
      this.error = {
        status: 0,
        message: 'Validación',
        details: 'La placa es requerida',
      };
      return;
    }

    // Alfanumérica, máx 10 caracteres (regex)
    if (!/^[A-Z0-9]{1,10}$/.test(plateClean)) {
      this.error = {
        status: 0,
        message: 'Validación',
        details:
          'La placa debe ser alfanumérica (máx. 10 caracteres, solo letras y números)',
      };
      return;
    }

    // ── Llamada a la API ──
    this.loading = true;

    this.vehicleService
      .registerEntry({
        plate: plateClean,
        vehicleType: this.vehicleType,
      })
      .subscribe({
        next: (response) => {
          // Éxito: guardamos la respuesta y reseteamos el formulario
          this.success = response;
          this.plate = '';
          this.vehicleType = 'Carro';
          this.loading = false;
        },
        error: (err: ApiError) => {
          // Error: mostramos el mensaje al usuario
          this.error = err;
          this.loading = false;
        },
      });
  }

  /**
   * clearSuccess(): Oculta el mensaje de éxito.
   * Se llama cuando el usuario hace clic en la "X" del alerta.
   */
  clearSuccess(): void {
    this.success = null;
  }
}
