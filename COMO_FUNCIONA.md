# Cómo funciona CliniSign (código y flujo)

## Idea

Un SUPERADMIN manda desde el frontend. Cada IPS tiene su propia base PostgreSQL. Los usuarios solo entran si el SUPERADMIN (o el ADMINIPS de esa IPS) los registró. Cada IPS llena pacientes, agenda, ambulancias, solicitudes, historias y consentimientos.

## Piezas

```
React (5173)  --JWT + X-Ips-Id-->  Spring Boot (8080)
                                   ├ clinisign_master  (IPS, superadmin, SMTP/WhatsApp)
                                   └ ips_<nit>         (usuarios, pacientes, citas, ...)
```

## Arranque de una petición tenant

1. El front guarda `token` e `ipsId` en localStorage.
2. `frontend/src/services/api.ts` pone `Authorization: Bearer ...` y `X-Ips-Id`.
3. `JwtAuthFilter` valida el JWT y deja el rol en Spring Security.
4. `TenantInterceptor` pone `TenantContext.ipsId`.
5. `RoutingDataSource` abre el pool de `ips_<nit>`.
6. El controlador tenant lee o escribe esa BD.

El SUPERADMIN no trae `ipsId` en el JWT. Elige la IPS en la barra y el header hace el resto.

## Login

`AuthService.login`:

- Sin `ipsId`: busca en `superadmin_users`.
- Con `ipsId`: setea el tenant y busca en `usuarios` de esa IPS.
- Usuario inactivo o inexistente = no entra.

## Registrar IPS (solo front)

`POST /api/ips/create` → `IpsProvisioningService`:

1. Inserta la IPS en master.
2. `CREATE DATABASE ips_<nit>`.
3. Corre `schema-tenant.sql` (incluye `citas`).
4. Crea roles y el ADMINIPS con BCrypt.
5. Registra el DataSource.

## Agenda y WhatsApp

Tabla `citas` en cada IPS.

- `POST /api/citas` agenda. Copia el teléfono del paciente si no se envía otro.
- `POST /api/citas/{id}/recordatorio` arma el texto y:
  - si la IPS tiene token de Meta Cloud API → envía el mensaje.
  - si no → devuelve `https://wa.me/57...` y el front lo abre.
- `AgendaScheduler` corre cada minuto, recorre IPS activas y envía recordatorios cuando falta el margen configurado (`recordatorioMinutos`, por defecto 60).

Config WhatsApp: `PUT /api/ips/{id}/config` con `whatsappEnabled`, `whatsappToken`, `whatsappPhoneNumberId`.

## Dashboard

`GET /api/citas/resumen` + estadísticas. El dashboard pinta citas de hoy y próximos 7 días.

## Módulos tenant

| Ruta | Clase | Tabla |
|---|---|---|
| /api/usuarios | UsuarioController | usuarios |
| /api/pacientes | PacienteController | pacientes |
| /api/citas | CitaController | citas |
| /api/ambulancias | AmbulanciaController | ambulancias |
| /api/solicitudes | SolicitudController | solicitudes_servicio |
| /api/historias-clinicas | HistoriaClinicaController | historias_clinicas |
| /api/consentimientos | ConsentimientoController | consentimientos |
| /api/reportes | ReporteController | conteos |

## Qué cambiar en local

Ver `LOCAL.md`.
