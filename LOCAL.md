# Qué cambiar y agregar para correrlo en su máquina

## Obligatorio

1. PostgreSQL 15 en marcha.
2. Base maestra:

```sql
CREATE DATABASE clinisign_master;
```

3. Si su usuario no es `postgres` / `admin123`, edite
   `backend/src/main/resources/application.properties`:

```
master.datasource.username=SU_USUARIO
master.datasource.password=SU_CLAVE
provisioning.datasource.username=SU_USUARIO
provisioning.datasource.password=SU_CLAVE
```

Ese usuario debe poder hacer `CREATE DATABASE`.

4. Backend en IntelliJ: abrir `backend`, Run `ClinisignApplication` (puerto 8080).
5. Frontend:

```bash
cd frontend
npm install
npm run dev
```

6. Navegador: http://localhost:5173

## Semilla

SUPERADMIN `mantenimientojms@hotmail.com` / `admin123456`

Luego en el front: Registrar IPS → Staff → Agenda.

## WhatsApp (opcional)

Sin token el sistema **sí agenda** y abre `wa.me` para mandar el recordatorio a mano.

Para envío automático (Cloud API de Meta):

1. App en developers.facebook.com → WhatsApp → número de prueba.
2. Copie el token y el Phone Number ID.
3. Postman o front: `PUT /api/ips/{id}/config`

```json
{
  "whatsappEnabled": true,
  "whatsappToken": "EAAB...",
  "whatsappPhoneNumberId": "1234567890"
}
```

El programador revisa citas cada 60 segundos (`clinisign.agenda.scheduler-ms`).

## Postman

1. Importe `postman/CliniSign.postman_collection.json`
2. Importe `postman/CliniSign.postman_environment.json`
3. Login SUPERADMIN → copie el `token` del JSON a la variable `token`
4. Tras crear la IPS, ponga `ipsId` real
5. En peticiones de módulos tenant deje `X-Ips-Id`

## Docker

```bash
docker compose up --build
```

App en http://localhost:5173

## Si la IPS ya existía sin tabla citas

El EMF tenant usa `hibernate.hbm2ddl.auto=update`. Al reiniciar el backend se crea `citas`.
Si no aparece:

```sql
-- conéctese a ips_<nit> y copie el CREATE TABLE citas de schema-tenant.sql
```
