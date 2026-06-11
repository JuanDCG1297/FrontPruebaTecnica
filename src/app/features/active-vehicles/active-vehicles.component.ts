import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VehicleService, ApiError } from '../../core/services/vehicle.service';
import { VehicleResponse } from '../../core/models/vehicle.models';

@Component({
  selector: 'app-active-vehicles',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './active-vehicles.component.html',
  styleUrls: ['./active-vehicles.component.css'],
})
export class ActiveVehiclesComponent implements OnInit, OnDestroy {
  vehicles: VehicleResponse[] = [];
  loading = false;
  error: ApiError | null = null;
  lastUpdate: Date | null = null;
  private autoRefreshInterval: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly vehicleService: VehicleService) {}

  ngOnInit(): void {
    this.loadVehicles();

    this.autoRefreshInterval = setInterval(() => {
      this.loadVehicles();
    }, 30000);
  }

  ngOnDestroy(): void {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
  }

  loadVehicles(): void {
    if (this.vehicles.length === 0) {
      this.loading = true;
    }

    this.vehicleService.getActiveVehicles().subscribe({
      next: (data) => {
        this.vehicles = data;
        this.loading = false;
        this.error = null;
        this.lastUpdate = new Date();
      },
      error: (err: ApiError) => {
        if (this.vehicles.length === 0) {
          this.error = err;
        }
        this.loading = false;
      },
    });
  }

  refresh(): void {
    this.loading = true;
    this.error = null;
    this.loadVehicles();
  }

  calcularTiempoActivo(entryTime: string): string {
    const entry = new Date(entryTime);
    const now = new Date();
    const diffMs = now.getTime() - entry.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 0) return '0 min';
    if (diffMin < 60) return `${diffMin} min`;

    const hours = Math.floor(diffMin / 60);
    const mins = diffMin % 60;
    return `${hours}h ${mins}min`;
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('es-CO', {
      timeZone: 'America/Bogota',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
}
