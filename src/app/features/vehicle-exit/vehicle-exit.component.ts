import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { switchMap } from 'rxjs/operators';
import { VehicleService, ApiError } from '../../core/services/vehicle.service';
import {
  VehicleResponse,
  ExitResponse,
} from '../../core/models/vehicle.models';

type Step = 'search' | 'confirm' | 'result' | 'error';

@Component({
  selector: 'app-vehicle-exit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicle-exit.component.html',
  styleUrls: ['./vehicle-exit.component.css'],
})
export class VehicleExitComponent {
  plate = '';

  // Flujo en pasos
  step: Step = 'search';
  loading = false;
  vehicleFound: VehicleResponse | null = null;
  exitResult: ExitResponse | null = null;
  error: ApiError | null = null;
  errorStep: 'search' | 'exit' = 'search';

  constructor(private readonly vehicleService: VehicleService) {}

  /** Paso 1: Buscar vehículo por placa */
  onSearch(): void {
    const plateClean = this.plate.toUpperCase().trim();

    if (!plateClean) {
      this.showError('search', {
        status: 0,
        message: 'Validación',
        details: 'Ingresá una placa para buscar',
      });
      return;
    }

    this.resetState();
    this.loading = true;

    this.vehicleService.getByPlate(plateClean).subscribe({
      next: (vehicle) => {
        if (vehicle.exitTime) {
          this.showError('search', {
            status: 0,
            message: 'Vehículo ya salió',
            details: `El vehículo ${vehicle.plate} ya registró su salida el ${vehicle.exitTime}.`,
          });
          this.loading = false;
          return;
        }

        this.vehicleFound = vehicle;
        this.step = 'confirm';
        this.loading = false;
      },
      error: (err: ApiError) => {
        this.showError('search', err);
        this.loading = false;
      },
    });
  }

  /** Paso 2: Confirmar y registrar salida */
  onConfirmExit(): void {
    if (!this.vehicleFound) return;

    this.error = null;
    this.loading = true;
    this.step = 'result';

    this.vehicleService.registerExit(this.vehicleFound.id).subscribe({
      next: (result) => {
        this.exitResult = result;
        this.step = 'result';
        this.loading = false;
      },
      error: (err: ApiError) => {
        this.showError('exit', err);
        this.loading = false;
      },
    });
  }

  /** Volver a empezar */
  onReset(): void {
    this.resetState();
    this.plate = '';
  }

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valor);
  }

  private showError(step: 'search' | 'exit', err: ApiError): void {
    this.error = err;
    this.errorStep = step;
    this.step = 'error';
  }

  private resetState(): void {
    this.step = 'search';
    this.loading = false;
    this.vehicleFound = null;
    this.exitResult = null;
    this.error = null;
    this.errorStep = 'search';
  }
}
