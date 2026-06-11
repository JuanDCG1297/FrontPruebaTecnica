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
  selector: 'app-vehicle-entry',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicle-entry.component.html',
  styleUrls: ['./vehicle-entry.component.css'],
})
export class VehicleEntryComponent {
  readonly vehicleTypes = VEHICLE_TYPES;

  // Form model
  plate = '';
  vehicleType: VehicleType = 'Carro';

  // UI state
  loading = false;
  success: EntryResponse | null = null;
  error: ApiError | null = null;

  constructor(private readonly vehicleService: VehicleService) {}

  onSubmit(): void {
    // Resetear estados previos
    this.success = null;
    this.error = null;

    // Validación básica del lado del cliente
    const plateClean = this.plate.toUpperCase().trim();
    if (!plateClean) {
      this.error = {
        status: 0,
        message: 'Validación',
        details: 'La placa es requerida',
      };
      return;
    }

    if (!/^[A-Z0-9]{1,10}$/.test(plateClean)) {
      this.error = {
        status: 0,
        message: 'Validación',
        details:
          'La placa debe ser alfanumérica (máx. 10 caracteres, solo letras y números)',
      };
      return;
    }

    this.loading = true;

    this.vehicleService
      .registerEntry({
        plate: plateClean,
        vehicleType: this.vehicleType,
      })
      .subscribe({
        next: (response) => {
          this.success = response;
          this.plate = '';
          this.vehicleType = 'Carro';
          this.loading = false;
        },
        error: (err: ApiError) => {
          this.error = err;
          this.loading = false;
        },
      });
  }

  clearSuccess(): void {
    this.success = null;
  }
}
