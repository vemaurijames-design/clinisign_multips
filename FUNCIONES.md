# Mapa de funciones CliniSign

## Quién hace qué

| Función | SUPERADMIN | ADMINIPS | AUXILIAR | RADIOPERADOR | TECNICO | CALIDAD |
|---|---|---|---|---|---|---|
| Registrar IPS + BD | Sí (front) | No | No | No | No | No |
| Activar / desactivar IPS | Sí | No | No | No | No | No |
| Ver conteo de tablas por IPS | Sí | No | No | No | No | No |
| Crear staff (incl. ADMINIPS extra) | Sí | Sí (su IPS) | No | No | No | No |
| Login | Semilla | Solo si el SUPERADMIN lo creó | Igual | Igual | Igual | Igual |
| Pacientes + Excel | CRUD | CRUD | Crear / ver | No | No | No |
| Ambulancias | CRUD | CRUD | No | No | Crear / editar | No |
| Solicitudes / despacho | Sí | Sí | No | Sí | No | No |
| Historias clínicas | Sí | Sí | Crear / ver | No | No | No |
| Consentimientos + PDF | Sí | Sí | Crear / ver | No | No | No |
| Reportes | Sí | Sí | No | No | No | Sí |

## Backend — para qué sirve cada pieza

### Maestro (`com.clinisign.master`)

- `AuthController` / `AuthService`: login. Sin `ipsId` busca en `superadmin_users`. Con `ipsId` busca en `usuarios` de esa BD.
- `IpsController`:
  - `GET /api/ips/list` público y reducido (combo de login).
  - `GET /api/ips/admin` lista completa, solo SUPERADMIN.
  - `POST /api/ips/create` registra IPS desde el front.
  - `PUT /api/ips/{id}` edita o activa/desactiva.
- `IpsProvisioningService` + `DataSourceManager`: crean la BD tenant y el ADMINIPS inicial.
- `SuperadminController` + `SuperadminStaffService`:
  - `GET /api/superadmin/ips/{id}/usuarios`
  - `POST/PUT/DELETE` usuarios de esa IPS
  - `GET /api/superadmin/ips/{id}/resumen` conteos de tablas

### Tenant (`com.clinisign.tenant`)

- `UsuarioController`: staff de la IPS en contexto (`X-Ips-Id` o claim JWT).
- `PacienteController`: CRUD + Excel.
- `AmbulanciaController`: parque automotor.
- `SolicitudController`: despacho.
- `HistoriaClinicaController`: HC-FM-05.
- `ConsentimientoController`: documento + PDF.
- `ReporteController`: estadísticas y PDF.

### Infra

- `JwtAuthFilter`: Bearer o `?token=` (PDF).
- `TenantInterceptor`: pone `TenantContext` según header o JWT.
- `RoutingDataSource`: elige el pool `ips_<nit>`.
- `PermisoUtil`: SUPERADMIN y ADMINIPS editan; radioperador despacha.

## Frontend — pantallas

- `Login.tsx`: SUPERADMIN o usuario de IPS. Sin registro público.
- `ListIps.tsx`: panel maestro, conteos, Entrar / Staff / Activar.
- `CreateIps.tsx`: formulario que ordena al backend crear IPS + ADMINIPS.
- `Usuarios.tsx`: staff. SUPERADMIN usa APIs `/superadmin/...`. ADMINIPS usa `/usuarios`.
- `Dashboard.tsx`: resumen de la IPS seleccionada.
- Módulos operativos: `Pacientes`, `Ambulancias`, `Solicitudes`, `HistoriaClinica`, `Consentimientos`, `Reportes`.
- `Layout.tsx`: combo “IPS de trabajo” solo visible al SUPERADMIN.
- `RequireIps.tsx`: no deja entrar a un módulo tenant si el SUPERADMIN no eligió IPS.

## Cómo viaja una petición del staff

1. SUPERADMIN elige IPS en la barra → `localStorage.ipsId`.
2. Axios pone `Authorization` y `X-Ips-Id`.
3. `TenantInterceptor` valida que la IPS exista y esté activa.
4. JPA tenant lee/escribe `usuarios` de `ips_<nit>`.
5. El ADMINIPS de esa IPS, al loguearse, ya trae `ipsId` en el JWT y ve la misma tabla.

## Agenda
Tabla citas por IPS. Recordatorio WhatsApp (Cloud API o wa.me). Dashboard: citas de hoy y próximos 7 días. Scheduler cada 60s.
