# Guía paso a paso — montar CliniSign en IntelliJ IDEA

Esta guía asume que va a usar **el código ya generado** de esta carpeta `clinisign/`.
No tiene que teclear clase por clase: abre el backend como proyecto Maven y corre el frontend con Node.

## 0. Qué hace el sistema (regla de negocio)

1. Solo entra quien el SUPERADMIN registró.
2. El SUPERADMIN, desde el front, registra la IPS. El backend maestro crea la base `ips_<nit>` y el primer ADMINIPS.
3. El SUPERADMIN entra a esa IPS y carga el resto del staff (AUXILIAR, RADIOPERADOR, TECNICO, CALIDAD u otro ADMINIPS).
4. Cada usuario de IPS inicia sesión eligiendo su IPS y llena solo sus módulos.
5. El SUPERADMIN puede cambiar de IPS en la barra y ver las tablas de esa BD (usuarios, pacientes, ambulancias, etc.).

No se crea IPS a mano en pgAdmin salvo la base maestra `clinisign_master`.

---

## 1. Instalar herramientas

1. JDK 17 Temurin: https://adoptium.net/
2. IntelliJ IDEA Community: https://www.jetbrains.com/idea/download/
3. PostgreSQL 15: https://www.postgresql.org/download/
4. Node.js 18+: https://nodejs.org/
5. Plugin Lombok en IntelliJ: Settings → Plugins → Lombok → Install
6. Settings → Build → Compiler → Annotation Processors → Enable annotation processing

Compruebe en terminal:

```bash
java -version
node -v
npm -v
```

---

## 2. Crear solo la base maestra

En pgAdmin o `psql`:

```sql
CREATE DATABASE clinisign_master;
```

Usuario local sugerido: `postgres`  
Contraseña sugerida: `admin123`  
Puerto: `5432`

Si usa otra clave, cámbiela en `backend/src/main/resources/application.properties`.

El resto de bases (`ips_9018065095`, etc.) las crea el backend cuando el SUPERADMIN pulsa **Registrar IPS**.

---

## 3. Abrir el backend en IntelliJ

1. IntelliJ → Open.
2. Seleccione la carpeta `clinisign/backend` (la que tiene `pom.xml`).
3. Confíe en el proyecto Maven. Espere a que descargue dependencias.
4. Compruebe que el JDK del proyecto es 17: File → Project Structure → Project SDK = 17.
5. Abra `com.clinisign.ClinisignApplication`.
6. Run ▶.

En consola debe aparecer que Tomcat quedó en el puerto 8080 y que el SUPERADMIN semilla existe:

- Email: `mantenimientojms@hotmail.com`
- Clave: `admin123456`

Si falla la conexión: revise URL, usuario y clave de PostgreSQL.

---

## 4. Levantar el frontend

En otra terminal:

```bash
cd clinisign/frontend
npm install
npm run dev
```

Abra http://localhost:5173

Vite reenvía `/api` al backend `8080`.

---

## 5. Flujo de uso (en este orden)

### 5.1 Entrar como SUPERADMIN

Login → modo SUPERADMIN → email y clave de arriba. No elija IPS.

### 5.2 Registrar la IPS desde el front

Menú **Registrar IPS** → llene datos + ADMINIPS inicial → **Registrar IPS**.

El front llama `POST /api/ips/create`. El backend:

1. Guarda la IPS en `clinisign_master`.
2. Ejecuta `CREATE DATABASE ips_<nit>`.
3. Corre `schema-tenant.sql` (roles, usuarios, pacientes, ambulancias, solicitudes, HC, consentimientos, reportes).
4. Inserta roles y el usuario ADMINIPS con BCrypt.
5. Registra el pool de esa BD.

### 5.3 Cargar staff

Queda seleccionado en la IPS nueva. Menú **Staff / Usuarios** → cree AUXILIAR, RADIOPERADOR, TECNICO, CALIDAD.

Eso escribe en la tabla `usuarios` de **esa** BD, no en la maestra.

### 5.4 Entrar como ADMINIPS o staff

Cerrar sesión. Login → Usuario de una IPS → elija la IPS → email/clave que el SUPERADMIN creó.

### 5.5 Llenar módulos de la IPS

- Pacientes
- Ambulancias
- Solicitudes (pendiente → asignada → en ruta → completada)
- Historias clínicas HC-FM-05
- Consentimientos (firma + huella + PDF)
- Reportes

El SUPERADMIN también puede llenarlos: elige la IPS en la barra y entra al módulo.

---

## 6. Si prefiere crear el proyecto “desde cero” en IntelliJ

Solo si no quiere abrir esta carpeta:

1. New Project → Maven → JDK 17 → nombre `clinisign`.
2. Reemplace el `pom.xml` por el de `backend/pom.xml`.
3. Copie `src/main/java/com/clinisign` y `src/main/resources`.
4. Enable Lombok + annotation processing.
5. Run `ClinisignApplication`.
6. El frontend se crea aparte con Vite (`npm create vite@latest`) y se copian `frontend/src`, `package.json` y `vite.config.ts`.

Es más corto abrir la carpeta lista.

---

## 7. Docker (alternativa a IntelliJ)

```bash
cd clinisign
docker compose up --build
```

Útil para demo. Para desarrollar día a día use IntelliJ + `npm run dev`.
