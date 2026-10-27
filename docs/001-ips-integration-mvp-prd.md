# PRD: Integración Waylo–Confianza IPS (MVP)

**Estado:** aprobado para implementación
**Fecha:** 2026-10-26
**Repositorio:** `waylo.ai`

## Problema y objetivo

Waylo ya tiene una experiencia ciudadana funcional: autenticación, triage, red flags,
voz, adjuntos, perfil, preferencias y un panel para guardar EPS, cédula, autorización
y código temporal. Sin embargo, esos datos todavía no activan una conexión real con
la IPS. El frontend debe conservar esas capacidades y sumar un puente server-side hacia
`waylo.ai-backend`, sin exponer secretos ni tokens al navegador.

El MVP permitirá que un paciente:

1. Autorice a Waylo y seleccione Confianza.
2. Introduzca su cédula y el código temporal emitido por Confianza.
3. Vincule su cuenta de Waylo con su paciente en Confianza.
4. Consulte sus citas desde el agente cuando lo solicite.

## Alcance

### Incluido

- Route Handlers de Next.js como BFF para la integración IPS.
- Estado de vínculo en la configuración de Waylo.
- Flujo explícito de conexión desde el panel EPS.
- Consulta server-side de perfil IPS y citas.
- Contexto de citas para el agente cuando el paciente pregunta por ellas.
- Manejo de IPS no disponible, vínculo inexistente, código inválido y token vencido.
- Pruebas unitarias de rutas y cliente de integración.

### Fuera del alcance

- Crear, cancelar o reprogramar citas.
- Consultar disponibilidad.
- Historia clínica, documentos o autorizaciones clínicas.
- Migrar la autenticación actual de Waylo.
- Mover el triage, la voz, los adjuntos o el almacenamiento de conversaciones al backend.
- Comunicación directa del navegador con Confianza o con `waylo.ai-backend`.

## Actores y responsabilidades

| Actor | Responsabilidad |
|---|---|
| Paciente | Otorga autorización, introduce cédula y código temporal. |
| `waylo.ai` | Mantiene la UX, la sesión del paciente y las rutas BFF. |
| `waylo.ai-backend` | Protege el vínculo y adapta el contrato canónico a Confianza. |
| Confianza IPS | Valida el código de un solo uso y entrega el token limitado. |
| Agente Waylo | Responde con datos IPS únicamente cuando existe vínculo activo. |

## Flujo aprobado

```text
EpsPanel
  -> POST /api/ips/link
  -> Next.js valida la sesión Waylo
  -> POST /internal/ips/link al backend adaptador
  -> POST /api/v1/integrations/agent/token en Confianza
  -> backend cifra y guarda el token IPS
  -> GET /api/ips/appointments cuando el agente detecta una pregunta sobre citas
  -> backend descifra el token y consulta Confianza
  -> Waylo responde sin mostrar tokens ni credenciales
```

## Contrato del frontend

Las rutas BFF son internas a `waylo.ai`:

- `GET /api/ips/link`: devuelve estado del vínculo.
- `POST /api/ips/link`: recibe `document_type`, `document_number`, `eps` y `activation_code`.
- `DELETE /api/ips/link`: revoca el vínculo local de Waylo.
- `GET /api/ips/patient`: devuelve el perfil IPS normalizado.
- `GET /api/ips/appointments`: devuelve citas normalizadas.

Las rutas requieren la sesión existente de Waylo. Ningún secreto de integración se
envía desde componentes cliente.

## Reglas de seguridad

- `WAYLO_BACKEND_KEY` solo existe en el entorno server-side de Next.js.
- `CONFIANZA_AGENT_KEY` solo existe en `waylo.ai-backend`.
- El token entregado por Confianza nunca llega al navegador ni a la respuesta del BFF.
- El código temporal se envía una sola vez al backend y no se muestra de vuelta.
- El paciente no puede modificar su EPS institucional desde Waylo.
- Si la IPS no responde, el agente no inventa citas y conserva disponible el triage local.
- El agente no ejecuta operaciones de escritura en este MVP.

## Datos e integración

La identidad usada por el BFF es el `session.id` del frontend como `external_subject`.
El backend adaptador mantiene su propio registro de conexión y no necesita duplicar la
autenticación de Waylo. La sesión de Waylo sigue siendo la autoridad para el navegador.

## Estados visibles

- `none`: nunca se ha conectado.
- `active`: vínculo activo y token vigente.
- `expired`: se debe repetir la activación.
- `deactivated`: Confianza rechazó o desactivó el vínculo.
- `unavailable`: el backend o la IPS no están disponibles.

El estado local `acceso` de EPS no se tratará como equivalente al vínculo IPS: uno indica
que existen datos locales válidos y el otro confirma una activación real.

## Validaciones de aceptación

- Un usuario no autenticado recibe `401` y no se intenta llamar al backend adaptador.
- Un código inválido se muestra como error de conexión, sin borrar arbitrariamente el perfil.
- Una conexión exitosa muestra `active` en configuración.
- Una pregunta explícita por citas consulta Confianza solo con vínculo activo.
- La respuesta del agente incluye únicamente citas devueltas por la IPS.
- La caída de Confianza produce un mensaje controlado y no rompe el triage.
- El build y las pruebas del frontend pasan sin modificar las funcionalidades existentes.

## Riesgos y decisiones

- La sesión actual del frontend y la autenticación histórica del backend son sistemas
  distintos. Por eso el MVP usa BFF + `external_subject`, en lugar de compartir cookies.
- Confianza todavía no devuelve sexo, sede primaria, tipo de cita ni nombre de sede en
  el contrato mínimo. El MVP no mostrará esos campos.
- La red y las bases de datos de prueba deben estar aisladas antes de ejecutar una
  validación real; nunca se usará el `.env` productivo para seeds o pruebas destructivas.

## Evidencia y documentación relacionada

- Contrato interno del adaptador: `waylo.ai-backend/docs/001-ips-integration-mvp-prd.md`.
- Contrato de Confianza: `ConfianzaIPS/confianza-ips-backend/docs/006-waylo-agent-integration-mvp.md`.
- Flujo institucional de emisión: `ConfianzaIPS/confianza-ips-frontend/docs/006-waylo-agent-integration-mvp.md`.
