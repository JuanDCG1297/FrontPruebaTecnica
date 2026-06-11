// ========================================================================
// VEHICLE EXIT COMPONENT (Registrar Salida)
// ========================================================================
// Este componente maneja el flujo de SALIDA de vehículos en DOS pasos:
//
//   PASO 1: Buscar vehículo por placa
//     • Usuario ingresa la placa
//     • GET /api/Vehicles/GetByPlate?plate=XXX
//     • Muestra info del vehículo: tipo, hora de ingreso, tiempo transcurrido
//
//   PASO 2: Confirmar salida
//     • Usuario hace clic en "Registrar Salida"
//     • POST /api/Vehicles/{id}/exit
//     • Muestra resultado: minutos totales, tarifa, email enviado/no enviado
//
// ¿Por qué dos pasos?
//   1. UX: El usuario VE lo que va a pasar antes de confirmar
//   2. Técnico: Necesitamos el ID del vehículo (lo obtenemos en paso 1)
//      para llamar al endpoint de exit (paso 2). El usuario no conoce IDs,
//      solo conoce la placa.
//
// Manejo especial del email:
//   • Si emailSent === false, mostramos un warning con instrucciones
//     para que el usuario se comunique con soporte
//   • Esto es porque la API de email externa puede fallar
// ========================================================================

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VehicleService, ApiError } from '../../core/services/vehicle.service';
import { VehicleResponse, ExitResponse } from '../../core/models/vehicle.models';

@Component({
  selector: 'app-vehicle-exit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicle-exit.component.html',
  styleUrls: ['./vehicle-exit.component.css'],
})
export class VehicleExitComponent {
  // ──────────────────────────────────────────────────────────────────────
  // Propiedades
  // ──────────────────────────────────────────────────────────────────────

  // Formulario de búsqueda
  plate = '';

  // Estados
  step: 'search' | 'confirm' | 'result' = 'search';
  loading = false;
  error: ApiError | null = null;

  // Datos del vehículo encontrado (paso 1)
  vehicle: VehicleResponse | null = null;

  // Resultado de la salida (paso 2)
  result: ExitResponse | null = null;

  // ──────────────────────────────────────────────────────────────────────
  // Constructor
  // ──────────────────────────────────────────────────────────────────────

  constructor(private readonly vehicleService: VehicleService) {}

  // ──────────────────────────────────────────────────────────────────────
  // Métodos
  // ──────────────────────────────────────────────────────────────────────

  /**
   * searchVehicle(): PASO 1 — Busca el vehículo por placa.
   *
   * Validaciones antes de llamar a la API:
   *   1. Placa requerida (no vacía)
   *   2. Placa alfanumérica (máx 10 caracteres)
   *   3. Si el vehículo ya tiene exitTime → ya salió → error
   *      (esta validación la hacemos del lado del cliente porque
   *       el backend no diferencia entre activo/inactivo en GetByPlate)
   *
   * Después de la llamada exitosa:
   *   • Avanza al paso 'confirm' donde el usuario revisa y confirma
   */
  searchVehicle(): void {
    // Resetear estados previos
    this.error = null;
    this.vehicle = null;
    this.result = null;

    // ── Validación ──
    const plateClean = this.plate.toUpperCase().trim();

    if (!plateClean) {
      this.error = {
        status: 0,
        message: 'Validación',
        details: 'Ingresá una placa para buscar',
      };
      return;
    }

    if (!/^[A-Z0-9]{1,10}$/.test(plateClean)) {
      this.error = {
        status: 0,
        message: 'Validación',
        details: 'La placa solo puede contener letras y números, máx. 10 caracteres',
      };
      return;
    }

    // ── Llamada a la API ──
    this.loading = true;

    this.vehicleService.getByPlate(plateClean).subscribe({
      next: (vehicle) => {
        // ── Validación: vehículo ya salió ──
        if (vehicle.exitTime) {
          this.error = {
            status: 409,
            message: 'El vehículo ya salió',
            details: `La placa ${vehicle.plate} ya registró su salida.`,
          };
          this.loading = false;
          return;
        }

        // ── Todo bien: pasamos a confirmación ──
        this.vehicle = vehicle;
        this.step = 'confirm';
        this.loading = false;
      },
      error: (err: ApiError) => {
        this.error = err;
        this.loading = false;
      },
    });
  }

  /**
   * confirmExit(): PASO 2 — Confirma la salida del vehículo.
   *
   * Llama a POST /api/Vehicles/{id}/exit con el ID del vehículo
   * que obtuvimos en el paso 1.
   *
   * El backend:
   *   1. Calcula totalMinutes = Math.Ceiling((now - entryTime).TotalMinutes)
   *   2. Calcula fee = totalMinutes * 50
   *   3. Guarda exitTime = DateTime.UtcNow
   *   4. Intenta enviar email (no bloqueante)
   *   5. Devuelve ExitResponse con emailSent
   */
  confirmExit(): void {
    if (!this.vehicle) return;

    this.loading = true;
    this.error = null;

    this.vehicleService.registerExit(this.vehicle.id).subscribe({
      next: (response) => {
        this.result = response;
        this.step = 'result';
        this.loading = false;
      },
      error: (err: ApiError) => {
        this.error = err;
        this.loading = false;
      },
    });
  }

  /**
   * reset(): Vuelve al paso inicial de búsqueda.
   *
   * Se llama cuando el usuario quiere registrar otra salida
   * después de completar una. Resetea todo el estado del componente.
   */
  reset(): void {
    this.plate = '';
    this.step = 'search';
    this.loading = false;
    this.error = null;
    this.vehicle = null;
    this.result = null;
  }

  /**
   * goBack(): Vuelve del paso 2 (confirmación) al paso 1 (búsqueda).
   *
   * Permite al usuario corregir la placa sin perder el estado
   * del formulario de búsqueda.
   */
  goBack(): void {
    this.step = 'search';
    this.vehicle = null;
    this.error = null;
  }

  /**
   * getTimeDiff(): Calcula la diferencia horaria entre entryTime y ahora.
   *
   * Se usa en el paso de confirmación para mostrar al usuario
   * cuánto tiempo lleva estacionado el vehículo.
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
}
