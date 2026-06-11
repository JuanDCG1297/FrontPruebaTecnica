# 🅿️ FrontPruebaTecnica — Sistema de Gestión de Parqueadero

Frontend Angular para la prueba técnica, consume una API REST de .NET para gestionar el ingreso y salida de vehículos de un parqueadero.

---

## 📋 Requisitos

| Herramienta | Versión                           |
| ----------- | --------------------------------- |
| Node.js     | 18+                               |
| Angular CLI | 19.2.x                            |
| Navegador   | Chrome / Edge / Firefox (moderno) |

> **Nota:** El backend .NET debe estar corriendo en `https://localhost:44325`. Ver [`BackPruebaTecnica`](../BackPruebaTecnica) para instrucciones.

---

## 🚀 Instalación y Ejecución

```bash
# 1. Parado en la carpeta del frontend
cd FrontPruebaTecnica

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
ng serve
```

La app se abre en **http://localhost:4200/**.

---

## 🏗️ Arquitectura del Proyecto

```
FrontPruebaTecnica/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── models/          # Interfaces DTO (contratos con la API)
│   │   │   └── services/        # Servicios HTTP (comunicación con backend)
│   │   ├── features/
│   │   │   ├── vehicle-entry/   # Formulario de ingreso
│   │   │   ├── vehicle-exit/    # Flujo de salida (2 pasos)
│   │   │   └── active-vehicles/ # Lista de activos con auto-refresh
│   │   ├── app.component.*      # Layout shell (sidebar + router-outlet)
│   │   ├── app.config.ts        # Providers globales
│   │   └── app.routes.ts        # Definición de rutas con lazy loading
│   ├── environments/            # Configuración por entorno
│   ├── index.html               # Punto de entrada
│   └── styles.css               # Design system global
└── package.json
```

### Patrón de Arquitectura

**Feature-First + Standalone Components (Angular 19)**

- Cada feature es una carpeta independiente con su componente, template y estilos
- Todos los componentes son **standalone** (`standalone: true`) — no hay NgModules
- **Lazy Loading** mediante `loadComponent()` en las rutas
- Los componentes NO llaman a `HttpClient` directamente — siempre a través de `VehicleService`

### Flujo de Datos

```
Componente (HTML)
    │
    ▼
Componente (TS)  →  Servicio (VehicleService)  →  API REST (.NET)
    │                       │
    ▼                       ▼
 Estado local        ApiError (errores)
(loading/success/
error)
```

---

## 🧭 Rutas

| Ruta            | Componente                | Descripción                                        |
| --------------- | ------------------------- | -------------------------------------------------- |
| `/ingreso`      | `VehicleEntryComponent`   | Formulario para registrar ingreso de vehículo      |
| `/salida`       | `VehicleExitComponent`    | Flujo de 2 pasos: buscar placa → confirmar salida  |
| `/activos`      | `ActiveVehiclesComponent` | Lista de vehículos estacionados (auto-refresh 30s) |
| `/**` (default) | —                         | Redirige a `/ingreso`                              |

---

## 📡 API Endpoints

El frontend consume estos endpoints del backend:

| Método | Endpoint                             | Descripción               |
| ------ | ------------------------------------ | ------------------------- |
| `POST` | `/api/Vehicles/entry`                | Registrar ingreso         |
| `GET`  | `/api/Vehicles/GetByPlate?plate=XXX` | Buscar vehículo por placa |
| `POST` | `/api/Vehicles/{id}/exit`            | Registrar salida          |
| `GET`  | `/api/Vehicles/active`               | Listar vehículos activos  |

**Base URL:** `https://localhost:44325/api` (configurado en `environments/environment.ts`)

---

## 🧩 Componentes en Detalle

### 1. VehicleEntryComponent (`/ingreso`)

Formulario simple con:

- Input de placa (validación: alfanumérico, máx 10 caracteres)
- Select de tipo de vehículo (Carro / Moto)
- Botón "Registrar Ingreso"

**Flujo:** Ingresa placa → selecciona tipo → POST `/entry` → muestra resultado

### 2. VehicleExitComponent (`/salida`)

Flujo en **2 pasos**:

| Paso | Acción                    | API Call          |
| ---- | ------------------------- | ----------------- |
| 1    | Buscar vehículo por placa | `GET /GetByPlate` |
| 2    | Confirmar salida          | `POST /{id}/exit` |

En el paso 1 se valida que el vehículo no haya salido ya (cliente-side). En el paso 2 se muestra tarifa (COP), minutos totales y estado del envío de email.

### 3. ActiveVehiclesComponent (`/activos`)

Tabla con auto-refresh cada **30 segundos** mediante `interval()` + `switchMap()` de RxJS.

Características:

- Botón de recarga manual con cooldown de 3 segundos
- Spinner durante carga inicial
- Mensaje "No hay vehículos" cuando la lista está vacía
- Los errores de auto-refresh son silenciosos (no muestran alertas cada 30s)

### 4. AppComponent (Shell)

Layout principal con:

- **Sidebar izquierdo** con navegación a las 3 secciones
- **Router outlet** para renderizar el componente activo
- Resaltado automático del link activo (`routerLinkActive`)

---

## 🎨 Design System

Definido en `src/styles.css` como **CSS Custom Properties**:

```css
:root {
  --color-primary: #2563eb; /* Azul principal */
  --color-success: #16a34a; /* Verde éxito */
  --color-error: #dc2626; /* Rojo error */
  --color-warning: #d97706; /* Naranja warning */
  /* ... más variables ... */
}
```

Componentes CSS disponibles:

- `.card` — Contenedor con sombra y bordes redondeados
- `.alert` / `.alert-success` / `.alert-error` / `.alert-warning` — Alertas contextuales
- `.btn` / `.btn-primary` / `.btn-secondary` — Botones
- `.form-group` / `.form-control` / `.form-hint` — Formularios
- `.data-table` — Tabla con diseño limpio
- `.spinner` — Indicador de carga animado
- `.empty-state` — Estado vacío con icono
- Responsive: sidebar se colapsa en pantallas < 768px

---

## ⏱️ Timezone

Todas las fechas se muestran en la zona horaria **America/Bogota** (UTC-5), independientemente de la zona horaria del usuario. Esto se logra forzando el timezone en los pipes `| date:'...':'America/Bogota'`.

---

## ⚠️ Manejo de Errores

### Capas de defensa (email API)

1. **EmailDelegatingHandler** — HttpClient interceptor que maneja errores HTTP globales
2. **EmailClient** — Cliente HTTP con try-catch individual
3. **EmailService** — Servicio que intenta enviar y captura fallos
4. **ParkingService** — Servicio principal que no bloquea si el email falla

Si `emailSent === false`, el frontend muestra una alerta warning indicando que el correo no pudo enviarse pero la salida fue registrada exitosamente.

### Errores HTTP

El `VehicleService` transforma todos los errores HTTP en objetos `ApiError` con mensajes en español:

- `status: 0` → Error de conexión (servidor caído, CORS)
- `status: 400` → Validación fallida
- `status: 404` → Vehículo no encontrado
- `status: 409` → Conflicto (vehículo ya registrado o ya salió)
- `status: 5xx` → Error interno del servidor

---

## 🛠️ Comandos Útiles

```bash
ng serve          # Iniciar servidor de desarrollo (http://localhost:4200)
ng build          # Build de producción (output en dist/)
ng serve --open   # Iniciar y abrir navegador automáticamente
```

---

## 📝 Notas para el Evaluador

- **El proyecto usa Angular 19 con standalone components** — no hay `@NgModule` en ninguna parte
- **Lazy loading** en las 3 rutas principales — los bundles se cargan bajo demanda
- **Validación dual**: validación cliente-side (rápida) + validación backend (FluentValidation)
- **Todos los comentarios en el código están en español** y pensados para que entiendas QUÉ hace cada parte y POR QUÉ
- **El backend debe estar corriendo** para que la app funcione. Si no, verás errores de conexión con mensajes descriptivos
