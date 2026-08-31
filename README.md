# CliniSign Multi-IPS

SUPERADMIN registra IPS y staff desde el front. Cada IPS llena sus módulos, incluida la agenda con recordatorio WhatsApp. El dashboard muestra las citas del día.

## Documentos

- LOCAL.md — qué cambiar en su PC
- GUIA_INTELLIJ.md — IntelliJ paso a paso
- COMO_FUNCIONA.md — flujo del código
- FUNCIONES.md — roles
- postman/ — colección y environment

## Arranque rápido

CREATE DATABASE clinisign_master;

Backend: Run ClinisignApplication
Frontend: cd frontend && npm install && npm run dev
App: http://localhost:5173
API: http://localhost:8080

SUPERADMIN: mantenimientojms@hotmail.com / admin123456
