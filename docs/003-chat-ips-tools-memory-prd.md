# PRD: chat conectado a IPS y memoria paciente-scoped

**Estado:** aprobado para implementación
**Fecha:** 2026-10-29
**Repositorio propietario:** `waylo.ai`
**Repositorio compañero:** `waylo.ai-backend`

## Problema y objetivo

La configuración de Waylo puede crear un vínculo activo con Confianza IPS, pero el
chat principal continúa llamando directamente a Reto desde `runTriage`. Por eso el
agente no recibe el sujeto externo de la sesión, no activa las herramientas IPS y
puede afirmar que no tiene capacidad para gestionar citas.

Además, las conversaciones actuales viven únicamente en `localStorage`, con un
límite de 15 conversaciones y una retención de siete días. Ese historial no sirve
como memoria entre conversaciones, dispositivos o sesiones.

El objetivo es mantener la UX y el triage actuales, pero conectar el chat con el
relay interno de `waylo.ai-backend`, habilitar las operaciones patient-scoped de la
IPS y añadir memoria clínica estructurada, explícitamente confirmada por el
paciente.

## Alcance

### Incluido

- Mantener `POST /api/triage` como entrada del navegador.
- Ejecutar red flags antes de cualquier llamada IPS o tool.
- Enviar desde el servidor el `external_subject` basado en la sesión Waylo.
- Enviar y recibir el token temporal de confirmación de citas sin persistirlo.
- Mostrar respuestas del backend conservando `TriageResponse` y la tarjeta actual.
- Comunicar al modelo si existe vínculo IPS activo, sin exponer tokens.
- Recuperar memoria confirmada relevante para cada consulta.
- Proponer memoria estructurada solo cuando el paciente lo solicite.
- Confirmar, listar, editar y eliminar memoria desde rutas server-side.
- Borrar la memoria por cascada al eliminar la cuenta.
- Actualizar documentación, pruebas y variables server-only.

### Fuera del alcance

- Migrar autenticación, sesiones, límites o conversaciones completas al backend.
- Guardar transcripciones, archivos, respuestas completas del modelo o diagnósticos.
- Modificar rutas, modelos o permisos de `ConfianzaIPS` sin evidencia contractual.
- Exponer rutas administrativas, médicas o de personal como herramientas del paciente.
- Cambiar la UX de voz, títulos o streaming salvo los ajustes necesarios para el
  nuevo contrato.

## Actores y responsabilidades

| Actor | Responsabilidad |
|---|---|
| Paciente | Vincula la IPS, confirma operaciones de escritura y confirma memorias. |
| `waylo.ai` | Sesión, límites, red flags, UX, BFF, memoria propia y presentación. |
| `waylo.ai-backend` | Relay LLM, tools, tokens IPS cifrados y normalización del contrato. |
| Confianza IPS | Fuente institucional de paciente, historia y citas. |

## Flujo aprobado

```text
ChatApp
  -> POST /api/triage
  -> red flags y límites
  -> memoria Waylo confirmada + estado IPS
  -> POST /internal/chat/completion
       external_subject = session.id
       pending_appointment_token opcional
  -> Reto con tools patient-scoped
  -> adaptador IPS -> Confianza
  -> texto final + pending_appointment opcional
  -> respuesta TriageResponse al navegador
```

## Memoria

La memoria se asociará a `persona_id`, nunca a `session_id`, al navegador o a una
conversación. Las categorías iniciales son antecedente/condición, alergia,
medicamento, cirugía, embarazo y otro.

Cada registro tendrá valor legible, detalles JSON opcionales, estado vigente o
resuelto, origen `user_confirmed`, consentimiento y marcas de tiempo.

Reglas:

- El modelo solo propone memoria cuando el paciente pide recordar un dato.
- El paciente debe confirmar antes de guardar.
- La memoria debe poder revisarse, editarse y eliminarse.
- `IPS_OFICIAL` prevalece sobre `WAYLO_CONFIRMADO` ante conflictos.
- Un dato recordado no reemplaza la evaluación de síntomas actuales.
- La memoria no autoriza diagnósticos, prescripciones ni decisiones de urgencia.

## Contratos

El BFF enviará al backend un payload interno que conserva `model`, `temperature`,
`system` y `messages`, y añade:

```json
{
  "external_subject": "id-de-sesion-waylo",
  "pending_appointment_token": "token-opaco-temporal"
}
```

El backend puede devolver:

```json
{
  "text": "{\"mensaje\":\"...\",\"listo\":false}",
  "pending_appointment": {
    "token": "...",
    "action": "create_appointment",
    "summary": "..."
  }
}
```

El token pendiente vive únicamente en memoria del estado del chat y se elimina al
confirmar, rechazar, cambiar de conversación o cerrar la sesión.

## Seguridad y privacidad

- Las claves internas, del proveedor y de la IPS permanecen server-side.
- El navegador nunca recibe tokens de Confianza.
- El modelo recibe únicamente resultados normalizados y necesarios.
- Las operaciones de escritura requieren confirmación explícita.
- Los errores de IPS degradan de forma controlada y no generan datos inventados.
- La eliminación de cuenta elimina la memoria local persistente.

## Validaciones de aceptación

- Una pregunta de citas con vínculo activo utiliza el backend y no llama Reto desde
  `waylo.ai`.
- Una pregunta de citas sin vínculo produce una respuesta controlada.
- El agente puede usar todas las tools patient-scoped aprobadas por el backend.
- Crear, cancelar y reprogramar nunca ejecutan la primera propuesta.
- La segunda solicitud solo ejecuta la misma acción si el paciente confirma.
- Una red flag evita llamadas IPS y tools antes de la respuesta urgente.
- Una memoria confirmada aparece en una conversación posterior del mismo paciente.
- Una memoria no confirmada nunca se persiste.
- Editar, eliminar cuenta o borrar memoria elimina el dato persistente.
- No se persisten conversaciones completas ni adjuntos.

## Riesgos y pendientes operativos

- Production y Preview deben tener alineadas `WAYLO_BACKEND_URL`,
  `WAYLO_BACKEND_KEY`, `WAYLO_INTERNAL_KEY`, `RETO_KEY` y la configuración de
  Confianza. Los valores nunca se documentan.
- La fila `confianza` debe estar activa en la base del backend.
- El flujo conectado requiere una cuenta sintética de Confianza y una prueba E2E
  separada de los tests unitarios.
- La memoria clínica y las reglas de triage requieren revisión profesional antes
  de presentarse como protocolo clínico de producción.
