# Informe de revisión — CliniSign Multi-IPS

## Veredicto

El documento original es un **blueprint funcionalmente amplio**, no un proyecto listo para compilar.

- Cobertura funcional: **alta** (multi-tenant, login dual, CRUD, Excel, PDF, roles, SMTP por IPS).
- Calidad para montar en local tal cual: **baja**. No arranca sin correcciones.
- Esta carpeta entrega una versión **completa, corregida y responsive**.

No era “código incompleto al 40%”. Era “especificación al ~85%” con errores que impiden el arranque.

## Qué sí estaba

- Modelo de una BD por IPS + BD maestra
- JWT con rol e ipsId
- Entidades de negocio (paciente, ambulancia, solicitud, HC-FM-05, consentimiento, reporte, usuario)
- Provisionamiento conceptual de BD tenant
- Frontend de las 11 pantallas
- Flujo de solicitud Pendiente → Asignada → En ruta → Completada
- Firma/huella en canvas y PDF iText

## Qué faltaba o estaba roto

### Compilación

1. `@EnableTransactionManager` no existe. Debe ser `@EnableTransactionManagement`.
2. `ips.isActivo()` / `sa.isActivo()` no compilan con `Boolean`. Lombok genera `getActivo()`.
3. Dependencia `itext7-core` usada como jar. Lo correcto es `kernel` + `layout` + `io`.
4. Hash BCrypt de `master-init.sql` era un placeholder inválido.
5. `DataSourceManager` no hasheaba la clave del ADMINIPS (dejaba un placeholder).
6. Columna SQL `neurológico` vs campo JPA `neurologico`.

### Multi-tenant

7. `RoutingDataSource.addDataSource` usaba `getTargetDataSources()` de forma incorrecta.
8. Ciclo de beans: `TenantDataSourceConfig` ↔ `DataSourceManager` ↔ `RoutingDataSource`.
9. Login de IPS no pasaba por el interceptor; había que setear `TenantContext` a mano (sí estaba, pero frágil).
10. Tras crear una IPS nueva el pool no siempre se registraba en el routing.

### Seguridad y permisos

11. `/api/ips/create` y `/api/ips/list` en `permitAll`. Create ahora exige SUPERADMIN. List sigue público porque el login necesita el combo de IPS.
12. El radioperador no podía actualizar solicitudes: `requerirEdicion()` solo deja SUPERADMIN/ADMINIPS. Corregido con `requerirOperacionSolicitud()`.
13. Los iframe de PDF mandaban el token por querystring, pero el filtro solo leía `Authorization`. Ahora acepta ambos.

### Frontend

14. No era responsive: sidebar fijo, grids de 3-6 columnas, tablas sin scroll.
15. Estilos 100% inline.
16. URL de PDF rota fuera de localhost:8080.

### Operación

17. No había Docker Compose.
18. Host de tenant hardcodeado a `localhost` (rompe Docker). Ahora usa `tenant.datasource.host`.
19. No había manejador de errores JSON (`message`), y el login del front dependía de eso.
20. Serialización JPA LAZY reventaba listados. Relaciones de listado pasaron a EAGER.
21. SMTP fallaba en silencio o con excepción si no había password. Ahora avisa y no tumba el alta del consentimiento.

## Qué se corrigió en esta entrega

- Proyecto Maven + Vite real, no fragmentos sueltos
- Beans multi-tenant desacoplados con `ObjectProvider`
- Provisionamiento con BCrypt real y nombres de BD sanitizados
- JWT query param para PDF
- Permisos de despacho para RADIOPERADOR
- Layout móvil con menú hamburguesa
- Docker Compose (Postgres + backend + frontend)
- Variables de entorno para host de BD

## Limitaciones que siguen (no bloquean el demo local)

- No hay tests automatizados.
- SMTP hay que configurarlo por IPS para que el correo salga de verdad.
- No hay captura real de huella biométrica: el canvas es una representación digital.
- No hay auditoría completa ni firma electrónica certificada (Pades/Xades).
- Superadmin no tiene selector persistente de “impersonar IPS” más allá del header `X-Ips-Id`.
- Crear IPS exige que el usuario de PostgreSQL pueda hacer `CREATE DATABASE`.
- Contraseñas semilla en claro en el README: solo para laboratorio.

## Cómo está organizado el código

```
clinisign/
  backend/     Spring Boot
  frontend/    React + Vite
  docker-compose.yml
  README.md
  INFORME.md
```

Backend:

- `config/` autenticación, tenant, mail, security
- `master/` IPS, superadmin, login, provisionamiento
- `tenant/` negocio de cada IPS
- `util/PermisoUtil.java` reglas de rol

Frontend:

- `pages/` pantallas
- `components/` layout responsive, firma
- `services/` API con JWT + X-Ips-Id
- `styles.css` mobile-first
