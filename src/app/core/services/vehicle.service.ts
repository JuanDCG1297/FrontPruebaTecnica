import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  EntryRequest,
  EntryResponse,
  ExitResponse,
  VehicleResponse,
} from '../models/vehicle.models';

export interface ApiError {
  status: number;
  message: string;
  details?: string;
}

@Injectable({
  providedIn: 'root',
})
export class VehicleService {
  private readonly apiUrl = `${environment.apiUrl}/vehicles`;

  constructor(private readonly http: HttpClient) {}

  /**
   * POST /api/Vehicles/entry — Registra el ingreso de un vehículo
   */
  registerEntry(request: EntryRequest): Observable<EntryResponse> {
    const body: EntryRequest = {
      ...request,
      plate: request.plate.toUpperCase().trim(),
    };

    return this.http.post<EntryResponse>(`${this.apiUrl}/entry`, body).pipe(
      catchError((err: HttpErrorResponse) => this.handleError(err))
    );
  }

  /**
   * GET /api/Vehicles/GetByPlate?plate=XXX — Obtiene un vehículo por su placa
   */
  getByPlate(plate: string): Observable<VehicleResponse> {
    const params = new HttpParams().set('plate', plate.toUpperCase().trim());

    return this.http
      .get<VehicleResponse>(`${this.apiUrl}/GetByPlate`, { params })
      .pipe(catchError((err: HttpErrorResponse) => this.handleError(err)));
  }

  /**
   * POST /api/Vehicles/{id}/exit — Registra la salida de un vehículo
   */
  registerExit(id: string): Observable<ExitResponse> {
    return this.http
      .post<ExitResponse>(`${this.apiUrl}/${id}/exit`, {})
      .pipe(catchError((err: HttpErrorResponse) => this.handleError(err)));
  }

  /**
   * GET /api/Vehicles/active — Lista todos los vehículos activos en el parqueadero
   */
  getActiveVehicles(): Observable<VehicleResponse[]> {
    return this.http
      .get<VehicleResponse[]>(`${this.apiUrl}/active`)
      .pipe(catchError((err: HttpErrorResponse) => this.handleError(err)));
  }

  // ────────────────────────── Manejo de errores ──────────────────────────

  /**
   * Centraliza el manejo de errores HTTP con mensajes descriptivos en español
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let apiError: ApiError;

    if (error.status === 0) {
      apiError = {
        status: 0,
        message: 'Error de conexión',
        details:
          'No se pudo conectar con el servidor. Verificá que la API esté corriendo en ' +
          environment.apiUrl,
      };
    } else {
      const serverMessage =
        typeof error.error === 'string'
          ? error.error
          : error.error?.message || error.message || 'Error desconocido';

      apiError = {
        status: error.status,
        message: this.getStatusMessage(error.status),
        details: serverMessage,
      };
    }

    console.error('[VehicleService] API Error:', apiError);
    return throwError(() => apiError);
  }

  private getStatusMessage(status: number): string {
    const messages: Record<number, string> = {
      400: 'Solicitud inválida — revisá los datos ingresados',
      404: 'Vehículo no encontrado',
      409: 'Conflicto — el vehículo ya está registrado o ya salió',
      500: 'Error interno del servidor',
    };
    return messages[status] || `Error ${status}`;
  }
}
