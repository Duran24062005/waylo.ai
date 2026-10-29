This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Integración con Confianza IPS

La configuración EPS existente conserva su flujo local y ofrece una conexión server-side
con Confianza. En desarrollo, define `WAYLO_BACKEND_URL` y `WAYLO_BACKEND_KEY` en el
entorno de Next.js; la clave nunca debe llevar el prefijo `NEXT_PUBLIC_` ni llegar al
navegador. Las rutas BFF `/api/ips/*` mantienen la sesión Waylo y delegan al backend
adaptador, que es el único que consulta Confianza.

El alcance, los contratos, la seguridad, las responsabilidades de cada repositorio y la
secuencia completa están documentados en [`docs/001-ips-integration-mvp-prd.md`](./docs/001-ips-integration-mvp-prd.md).

## Chat conectado y memoria clínica

El Route Handler `/api/triage` mantiene la sesión de Waylo y envía el historial al
backend privado `/internal/chat/completion`. Cuando la conexión con Confianza está activa,
el backend expone al agente las herramientas patient-scoped de perfil, catálogo,
disponibilidad, citas, historia institucional y constancias. Crear, cancelar y
reprogramar siempre requieren confirmación explícita.

La memoria entre conversaciones no reutiliza transcripciones: solo se carga la memoria
clínica estructurada que la persona confirmó, y puede editarse o eliminarse desde
Configuración → Memoria. La tabla se crea al ejecutar `npm run db:migrate`; las variables
`WAYLO_BACKEND_URL` y `WAYLO_BACKEND_KEY` deben existir únicamente en el entorno server-side.
El diseño y los contratos están en [`docs/003-chat-ips-tools-memory-prd.md`](./docs/003-chat-ips-tools-memory-prd.md).

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Votos de me gusta / no me gusta en Discord

Cada vez que alguien marca un mensaje de la IA como útil o no útil, `/api/feedback` envía un
aviso a un canal de Discord. Solo viaja el voto, el id del mensaje, el idioma y si la persona
tiene cuenta; nunca el texto de la conversación. Para activarlo, crea un webhook en el canal
(Configuración del servidor → Integraciones → Webhooks) y define `DISCORD_FEEDBACK_WEBHOOK_URL`
en `.env.local` y en el entorno de despliegue. Sin la variable, el botón funciona igual y no se
envía nada. La URL del webhook es un secreto: quien la tenga puede escribir en el canal.
