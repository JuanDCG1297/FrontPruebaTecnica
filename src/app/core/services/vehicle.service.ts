// ========================================================================
// VEHICLE SERVICE (Servicio de Vehículos)
// ========================================================================
// Esta es la capa que conecta el frontend con la API REST del backend.
// Todos los llamados HTTP pasan por acá.
//
// Patrón: Service Layer (Capa de Servicio)
// • Centraliza la lógica de comunicación HTTP
// • Traduce errores HTTP a objetos ApiError con mensajes en español
// • Los componentes NUNCA llaman a HttpClient directamente
//
// Inyección de dependencias:
// • providedIn: 'root' → Angular crea UNA sola instancia (singleton)
//   para toda la aplicación
// ========================================================================

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

// ========================================================================
// ApiError — Interfaz de error humanizada
// ========================================================================
// Reemplaza los errores técnicos de HTTP (códigos numéricos, stack traces)
// con mensajes que el COMPONENTE puede mostrar directamente al usuario.
//
// @property {number} status - Código HTTP (0 = error de red, 400, 404, 409, 500...)
// @property {string} message - Mensaje corto para el encabezado del alerta
// @property {string} [details] - Detalle adicional (ej: el mensaje exacto del backend)
export interface ApiError {
  status: number;
  message: string;
  details?: string;
}

@Injectable({
  providedIn: 'root', // Singleton — Angular crea una instancia única
})
export class VehicleService {
  // ──────────────────────────────────────────────────────────────────────
  // Propiedades privadas
  // ──────────────────────────────────────────────────────────────────────

  /**
   * URL base de la API de vehículos.
   * Se construye a partir de environment.apiUrl + '/vehicles'.
   *
   * Ejemplo: 'https://localhost:44325/api/vehicles'
   */
  private readonly apiUrl = `${environment.apiUrl}/vehicles`;

  // ──────────────────────────────────────────────────────────────────────
  // Constructor
  // ──────────────────────────────────────────────────────────────────────

  /**
   * @param http - HttpClient de Angular (provisto por provideHttpClient en app.config.ts)
   *
   * La inyección de dependencias (DI) se encarga de pasar el HttpClient
   * automáticamente. No necesitamos instanciarlo manualmente.
   */
  constructor(private readonly http: HttpClient) {}

  // ──────────────────────────────────────────────────────────────────────
  // Métodos públicos (API calls)
  // ──────────────────────────────────────────────────────────────────────

  /**
   * POST /api/Vehicles/entry
   *
   * Registra el ingreso de un vehículo al parqueadero.
   *
   * @param request - Datos del vehículo (vehicleType, plate, entryTime opcional)
   * @returns Observable que emite la respuesta del backend
   *
   * Flujo:
   *   1. Se limpia y normaliza la placa (mayúsculas, sin espacios)
   *   2. Se envía POST al backend
   *   3. Si la respuesta es exitosa → se emite EntryResponse
   *   4. Si hay error HTTP → se transforma a ApiError
   *
   * Códigos HTTP esperados:
   *   • 201 Created → Ingreso registrado
   *   • 400 Bad Request → Datos inválidos (placa vacía, tipo incorrecto)
   *   • 409 Conflict → Placa duplicada (ya está estacionado)
   */
  registerEntry(request: EntryRequest): Observable<EntryResponse> {
    // Normalizar placa: mayúsculas y sin espacios externos
    const body: EntryRequest = {
      ...request,
      plate: request.plate.toUpperCase().trim(),
    };

    return this.http.post<EntryResponse>(`${this.apiUrl}/entry`, body).pipe(
      catchError((err: HttpErrorResponse) => this.handleError(err))
    );
  }

  /**
   * GET /api/Vehicles/GetByPlate?plate=XXX
   *
   * Busca un vehículo por su placa.
   * Es el PRIMER paso del flujo de salida: necesitamos obtener el ID
   * del vehículo para después llamar al endpoint de exit.
   *
   * @param plate - Placa a buscar (se normaliza a mayúsculas)
   * @returns Observable con los datos del vehículo
   *
   * Nota importante:
   *   El backend requiere la placa como query parameter.
   *   HttpParams construye la URL correctamente escapando caracteres especiales.
   */
  getByPlate(plate: string): Observable<VehicleResponse> {
    const params = new HttpParams().set('plate', plate.toUpperCase().trim());

    return this.http
      .get<VehicleResponse>(`${this.apiUrl}/GetByPlate`, { params })
      .pipe(catchError((err: HttpErrorResponse) => this.handleError(err)));
  }

  /**
   * POST /api/Vehicles/{id}/exit
   *
   * Registra la salida de un vehículo.
   *
   * @param id - UUID del vehículo (obtenido de getByPlate)
   * @returns Observable con el resultado de la salida
   *
   * El backend calcula automáticamente:
   *   • totalMinutes = Math.Ceiling((exitTime - entryTime).TotalMinutes)
   *   • fee = totalMinutes * 50 (COP)
   *   • Intenta enviar email (emailSent = true si funcionó)
   *
   * Códigos HTTP esperados:
   *   • 200 OK → Salida registrada
   *   • 404 Not Found → ID inválido
   *   • 409 Conflict → Vehículo ya salió previamente
   */
  registerExit(id: string): Observable<ExitResponse> {
    return this.http
      .post<ExitResponse>(`${this.apiUrl}/${id}/exit`, {})
      .pipe(catchError((err: HttpErrorResponse) => this.handleError(err)));
  }

  /**
   * GET /api/Vehicles/active
   *
   * Obtiene la lista de vehículos que están actualmente en el parqueadero.
   * "Activos" = vehículos que NO tienen exitTime (aún no han salido).
   *
   * @returns Observable con array de vehículos activos
   *
   * Nota: Este endpoint fue AGREGADO al backend específicamente para
   * el frontend. No existía en la especificación original de la API.
   * Se implementó en VehiclesController.cs como [HttpGet("active")].
   */
  getActiveVehicles(): Observable<VehicleResponse[]> {
    return this.http
      .get<VehicleResponse[]>(`${this.apiUrl}/active`)
      .pipe(catchError((err: HttpErrorResponse) => this.handleError(err)));
  }

  // ──────────────────────────────────────────────────────────────────────
  // Manejo de errores (privado)
  // ──────────────────────────────────────────────────────────────────────

  /**
   * Centraliza la transformación de errores HTTP en objetos ApiError
   * con mensajes descriptivos en español.
   *
   * ¿Por qué es necesario?
   *   Angular devuelve los errores como HttpErrorResponse, que contiene
   *   detalles técnicos (status, statusText, error, etc.). Nosotros
   *   queremos mostrar mensajes AMIGABLES al usuario.
   *
   * Tipos de error:
   *   • status === 0 → Error de RED (servidor caído, CORS, etc.)
   *   • status 4xx → Error del CLIENTE (validación, no encontrado, conflicto)
   *   • status 5xx → Error del SERVIDOR
   *
   * @param error - HttpErrorResponse de Angular
   * @returns Observable que EMITE el error (no se completa, el componente
   *          se suscribe al error)
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let apiError: ApiError;

    if (error.status === 0) {
      // ── Error de red ──
      // status 0 significa que la petición ni siquiera llegó al servidor.
      // Esto puede pasar por:
      //   • El backend no está corriendo
      //   • Error de CORS (el navegador bloquea la petición)
      //   • Problema de DNS / red
      apiError = {
        status: 0,
        message: 'Error de conexión',
        details:
          'No se pudo conectar con el servidor. Verificá que la API esté corriendo en ' +
          environment.apiUrl,
      };
    } else {
      // ── Error del servidor ──
      // Intentamos extraer el mensaje del body de la respuesta.
      // El backend puede devolver el error en varios formatos:
      //   • string directo
      //   • Objeto con propiedad .message
      //   • Objeto ProblemDetails (RFC 7807) con .title y .detail
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

  /**
   * Traduce códigos HTTP a mensajes cortos en español.
   *
   * @param status - Código HTTP
   * @returns Mensaje descriptivo
   */
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
