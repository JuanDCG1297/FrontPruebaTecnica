// ========================================================================
// APP CONFIG (Configuración principal de la aplicación)
// ========================================================================
// En Angular 19+ (standalone), este archivo reemplaza al antiguo
// app.module.ts. Acá se declaran los providers (servicios) globales
// que toda la aplicación va a necesitar.
//
// ¿Qué es un provider?
//   Es una instrucción para el sistema de inyección de dependencias (DI)
//   de Angular. Le dice "cuando alguien pida HttpClient, dale esta versión".
//
// Diferencia con módulos (NgModule):
//   Antes (Angular <15): se usaba @NgModule con imports, providers, etc.
//   Ahora (Angular 15+): standalone components + app.config.ts
//   Es más simple y moderno.
// ========================================================================

import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';

/**
 * Configuración global de la aplicación.
 *
 * providers[] = lista de servicios disponibles para TODA la app.
 *
 * @provideZoneChangeDetection → Optimización de detección de cambios
 *   • eventCoalescing: true → Agrupa eventos para mejorar rendimiento
 *
 * @provideRouter → Sistema de rutas
 *   • routes → Las rutas definidas en app.routes.ts
 *
 * @provideHttpClient → Cliente HTTP
 *   • withFetch() → Usa la API fetch() del navegador en lugar de
 *     XMLHttpRequest. Es más moderna y performante.
 *
 * ¿Por qué no está VehicleService acá?
 *   Porque usa providedIn: 'root' en su decorador @Injectable.
 *   Eso ES el provider. No necesita declararse acá.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withFetch()),
  ],
};
