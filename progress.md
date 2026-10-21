# Registro de Estado del Proyecto (Session Memory)

## Estado Actual
- **Fase:** v1 funcional lista para la primera prueba del filtro de Red Flags.
- **Última actualización:** Base Next.js, guardrail de urgencia vital, triage local, sedes semilla y chat accesible.

## Decisiones Técnicas Adoptadas
- El modelo usa el proveedor Reto (`https://api.reto.pltk.mx/v1`, `grok-4.6`) con `RETO_KEY`. Temperatura 0.1.
- Sin API key, el cuestionario local de 3 a 4 preguntas sigue funcionando y nunca diagnostica.
- Las alertas de urgencia vital se evalúan antes del LLM y cortan el flujo con un mensaje fijo.
- Las sedes viven en `src/data/providers.json` y se filtran por nivel y EPS.

## Pendiente
1. Auditoría clínica de las respuestas (Fase 4).
2. Probar el filtro de Red Flags con `npm run test`.
