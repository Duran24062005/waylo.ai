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

## Errores del servidor en Discord

Con `DISCORD_ERRORS_WEBHOOK_URL` definida, el servidor avisa en un canal (por ejemplo `#errores`)
de lo que falla en producción: el gateway de IA, la voz, la integración IPS, la base de datos y
cualquier error que nadie atrape (gancho `onRequestError` de Next.js, en `src/instrumentation.ts`).
Cada aviso lleva el sitio, el error, su código y las primeras líneas de la pila. Se ocultan
contraseñas en URLs, tokens, claves largas y correos; nunca se envía el texto de la conversación.
El mismo error del mismo sitio se manda una vez por minuto (con el conteo de repeticiones
omitidas) y nunca más de 20 mensajes por minuto. En desarrollo local no se envía nada.
Para reportar un error a mano en una ruta: `reportError("api/mi-ruta", error)` de `@/lib/error-report`.
