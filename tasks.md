# Lista de Tareas y Backlog de Desarrollo

## Fase 1: Motor Conversacional y Guardrails Clínicos
- [x] Implementar el System Prompt en `AGENTS.md` dentro de la configuración del LLM.
- [x] Crear el módulo de detección rápida de palabras clave y semántica de "Red Flags" (Urgencia Vital).
- [x] Escribir tests unitarios que simulen 20 casos de urgencia grave para verificar que NUNCA desvíe a Medicina General.

## Fase 2: Base de Datos de Prestadores y Guías
- [x] Crear el esquema de base de datos para la Red de Prestadores (Campos: `nombre`, `tipo_atencion`, `direccion`, `eps_convenio`, `requisitos`).
- [x] Cargar dataset semilla con guías de clasificación de síntomas y sedes de prueba.
- [x] Implementar la búsqueda RAG/SQL para conectar la EPS del usuario con los prestadores disponibles.

## Fase 3: Interfaz de Usuario e Integración
- [x] Crear interfaz de chat en Next.js adaptable a móviles.
- [x] Agregar botones de respuesta rápida para síntomas comunes ("Dolor de cabeza", "Fiebre", "Dolor abdominal", "Golpe/Caída").
- [x] Diseñar tarjetas visuales destacadas para la instrucción final ("A dónde ir" y "Qué llevar").

## Fase 4: Pruebas de Cumplimiento Legal
- [ ] Auditar respuestas del agente con un profesional de la salud o auditor de calidad.
- [x] Validar inclusión del aviso legal (*Disclaimer*) al inicio o pie del chat.
