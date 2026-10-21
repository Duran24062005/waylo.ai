# Arquitectura Técnica: Navegador del Paciente

## 1. Stack Tecnológico
- **Frontend / Chat UI:** Next.js (React) + Tailwind CSS + Lucide Icons (diseño accesible, texto grande y claro para pacientes).
- **Backend / API:** Next.js API Routes / Node.js.
- **Orquestación IA:** Vercel AI SDK o LangChain.
- **Modelo LLM de Orientación:** Grok 4.7 / Claude 3.5 Sonnet / GPT-4o (con baja temperatura = 0.1 para evitar alucinaciones).
- **Base de Datos / Búsqueda:** PostgreSQL + PgVector o Supabase (para almacenamiento de logs y RAG de prestadores/guías).

## 2. Fuentes de Datos (Knowledge Base / RAG)
1. **Guías de Práctica Clínica y Protocolos de Triage (ej. Sistema Triage Manchester adaptado localmente):** Utilizados para parametrizar las preguntas de descarte de alarmas.
2. **Red de Prestadores de Salud:** Base de datos relacional/vectorial con:
   - Nombre de la sede / IPS.
   - Tipo de atención prestada (Urgencias 24h, Prioritaria, Citas externas).
   - Convenios con EPS / Aseguradoras.
   - Horarios, dirección y requisitos de ingreso.

## 3. Diagrama de Flujo del Agente
```
[Mensaje del Paciente]
       │
       ▼
[Filtro de Seguridad / Guardrails Red Flags] ──► (Si detecta peligro vital) ──► [Alerta Roja: Ir a Urgencias / Llama a Emergencias]
       │ (No hay peligro inmediato)
       ▼
[Evaluación de Síntomas en Lenguaje Común]
       │
       ▼
[Consulta RAG: Guías de Triage + Red de Prestadores]
       │
       ▼
[Respuesta Final: Nivel de Atención + Dónde ir + Qué llevar]
```

## 4. Requisitos de Seguridad y Privacidad
- No almacenar datos sensibles de salud asociados a identidades reales sin consentimiento explícito.
- Anonimización de logs conversacionales.
