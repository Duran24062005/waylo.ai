# PRD: Triage & Navegador del Paciente en el Sistema de Salud

## 1. Visión del Producto
Sistema conversacional enfocado en clasificar el dolor o malestar del usuario en lenguaje común para orientarlo hacia el nivel de atención adecuado (Urgencias, Consulta Prioritaria o Medicina General) y explicarle los requerimientos necesarios para su atención.

## 2. Definición del Dolor (Problem Statement)
Los usuarios/pacientes no comprenden la diferencia operativa entre urgencias, consulta prioritaria y consulta externa/medicina general. Esto produce:
- Congestión e ineficiencia en las salas de Urgencias con casos de baja complejidad.
- Desplazamientos innecesarios y pérdida de tiempo para el paciente.
- Mala asignación de recursos en la red de prestadores.

## 3. Clientes y Pagadores Target
- Entidades Promotoras de Salud (EPS).
- Secretarías de Salud e IPS.
- Líneas de atención médica telefónica/municipal (Centros Reguladores de Urgencias).

## 4. Límites Clínicos y Legales (Red Lines)
- **Regla de Oro:** Orientar NO es diagnosticar ni prescribir.
- El agente **JAMÁS** debe:
  - Dar diagnósticos médicos ni sugerir nombres de patologías como definitivos.
  - Recomendar medicamentos, dosis o tratamientos caseros.
  - Desalentar la búsqueda de atención médica si el paciente persiste con dudas.

## 5. Funcionalidades Principales (Scope v1)
1. **Detección Inmediata de Señales de Alarma (Red Flags):** Evaluación prioritaria de síntomas críticos (dolor torácico, pérdida de conciencia, dificultad respiratoria grave, parálisis repentina, sangrado masivo, etc.) para derivar de inmediato a Urgencias/Línea 123.
2. **Evaluación Simplificada en Lenguaje Común:** Cuestionario adaptativo de 3 a 5 preguntas cortas sin jerga médica para entender severidad y duración.
3. **Recomendación de Nivel de Atención:** Asignación clara a:
   - Urgencias Vitales/Hospitalarias.
   - Consulta Prioritaria.
   - Medicina General / Telemedicina.
4. **Instrucciones de Desplazamiento y Checklist:** Guía clara de qué llevar (Documento de identidad, exámenes previos, carné de afiliación, orden previa) y red de sedes recomendadas según su prestador.

## 6. Fuera de Alcance (Out of Scope v1)
- Agendamiento directo de citas en calendarios de IPS/EPS.
- Consulta de historias clínicas completas del paciente.
- Formulación de medicamentos.
