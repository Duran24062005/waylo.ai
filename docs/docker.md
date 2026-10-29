# Docker: frontend ciudadano Waylo

La imagen ejecuta el frontend Next.js en modo producción en el puerto `3000`.
Las variables server-side (`DATABASE_URL`, `AUTH_SECRET`, `WAYLO_BACKEND_URL` y
`WAYLO_BACKEND_KEY`, entre otras) se inyectan al ejecutar el contenedor; no se
incluyen en la imagen ni se pasan como argumentos de build.

## Construir y ejecutar

```bash
docker build -t waylo-frontend .
docker run --rm --env-file .env -p 3000:3000 waylo-frontend
```

El `HEALTHCHECK` consulta `/` en el puerto interno `3000`.

El lockfile actual no permite `npm ci` porque le faltan entradas opcionales de
`@emnapi`; por eso el Dockerfile usa `npm install --package-lock=false` de forma
temporal. Después de sincronizar `package-lock.json`, debe cambiarse a `npm ci`.
