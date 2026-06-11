// ========================================================================
// VEHICLE MODELS (Modelos de Vehículo)
// ========================================================================
// Este archivo define TODAS las estructuras de datos que usa la aplicación.
// Cada interfaz representa un contrato con la API REST del backend.
//
// Conceptos clave:
// • Las interfaces definen la FORMA de los datos, no su comportamiento
// • Coinciden 1:1 con los DTOs del backend (Application/DTOs/)
// • Se usa el prefijo "I" en algunos equipos, pero acá preferimos nombres
//   descriptivos como EntryRequest, ExitResponse, etc.
// ========================================================================

/**
 * Lista de tipos de vehículo aceptados por el backend.
 * Se usa `as const` para que TypeScript infiera los valores literales
 * y no los trate como strings genéricos.
 *
 * @example
 *   VEHICLE_TYPES[0] → 'Carro'
 *   VEHICLE_TYPES[1] → 'Moto'
 */
export const VEHICLE_TYPES = ['Carro', 'Moto'] as const;

/**
 * Tipo derivado automáticamente de VEHICLE_TYPES.
 * TypeScript lo entiende como: 'Carro' | 'Moto'
 * Esto nos da autocompletado y seguridad de tipos.
 */
export type VehicleType = typeof VEHICLE_TYPES[number];

// ────────────────────────────────────────────────────────────────────────
// ENTRY (Ingreso)
// ────────────────────────────────────────────────────────────────────────

/**
 * Request body para POST /api/Vehicles/entry
 *
 * Coincide con el DTO EntryRequest del backend (Application/DTOs/EntryRequest.cs).
 *
 * @property {VehicleType} vehicleType - 'Carro' | 'Moto'
 * @property {string} plate - Placa del vehículo (se envía en mayúsculas)
 * @property {string} [entryTime] - Fecha/hora opcional en ISO 8601.
 *   Si no se envía, el backend usa DateTime.UtcNow.
 *
 * Uso típico:
 *   const request: EntryRequest = { vehicleType: 'Carro', plate: 'ABC123' };
 */
export interface EntryRequest {
  vehicleType: VehicleType;
  plate: string;
  entryTime?: string;
}

/**
 * Response de POST /api/Vehicles/entry (201 Created)
 *
 * Coincide con EntryResponse.cs del backend.
 *
 * @property {string} id - UUID del registro (GUID en el backend)
 * @property {string} vehicleType - Nombre del tipo ('Carro' | 'Moto')
 * @property {string} plate - Placa en mayúsculas
 * @property {string} entryTime - Fecha/hora ISO 8601 con timezone
 */
export interface EntryResponse {
  id: string;
  vehicleType: string;
  plate: string;
  entryTime: string;
}

// ────────────────────────────────────────────────────────────────────────
// EXIT (Salida)
// ────────────────────────────────────────────────────────────────────────

/**
 * Response de POST /api/Vehicles/{id}/exit (200 OK)
 *
 * Coincide con ExitResponse.cs del backend.
 * Se genera cuando un vehículo sale del parqueadero.
 *
 * @property {number} totalMinutes - Minutos totales estacionado (redondeado hacia arriba)
 * @property {number} fee - Valor a pagar en COP ($50/min)
 * @property {boolean} emailSent - Indica si se pudo enviar la notificación por correo
 */
export interface ExitResponse {
  id: string;
  plate: string;
  vehicleType: string;
  entryTime: string;
  exitTime: string;
  totalMinutes: number;
  fee: number;
  emailSent: boolean;
}

// ────────────────────────────────────────────────────────────────────────
// VEHICLE INFO (Información general de vehículo)
// ────────────────────────────────────────────────────────────────────────

/**
 * Response de GET /api/Vehicles/GetByPlate y GET /api/Vehicles/active
 *
 * Coincide con VehicleResponse.cs del backend.
 * Sirve TANTO para vehículos activos (sin exitTime) como para vehículos
 * que ya salieron (con exitTime, totalMinutes y fee calculados).
 *
 * Las propiedades totalMinutes y fee son null CUANDO el vehículo aún
 * está estacionado (exitTime es null).
 */
export interface VehicleResponse {
  id: string;
  plate: string;
  vehicleType: string;
  entryTime: string;
  exitTime: string | null;     // null = sigue estacionado
  totalMinutes: number | null;  // null = aún en el parqueadero
  fee: number | null;           // null = aún en el parqueadero
  emailSent: boolean;
}
