export const VEHICLE_TYPES = ['Carro', 'Moto'] as const;
export type VehicleType = typeof VEHICLE_TYPES[number];

/** Request body para POST /api/Vehicles/entry */
export interface EntryRequest {
  vehicleType: VehicleType;
  plate: string;
  entryTime?: string; // ISO 8601 — opcional, el backend usa DateTime.UtcNow si no se envía
}

/** Response de POST /api/Vehicles/entry */
export interface EntryResponse {
  id: string;
  vehicleType: string;
  plate: string;
  entryTime: string;
}

/** Response de POST /api/Vehicles/{id}/exit */
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

/** Response de GET /api/Vehicles/GetByPlate y GET /api/Vehicles/active */
export interface VehicleResponse {
  id: string;
  plate: string;
  vehicleType: string;
  entryTime: string;
  exitTime: string | null;
  totalMinutes: number | null;
  fee: number | null;
  emailSent: boolean;
}
