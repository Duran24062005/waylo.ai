# PRD: conexión Waylo–Confianza y configuración de despliegue

**Estado:** implementado parcialmente; el despliegue requiere configuración coordinada
**Fecha:** 2026-10-28
**Repositorio:** `waylo.ai`

## Problema y objetivo

La conexión desde Configuración → EPS puede fallar antes de enviar la solicitud: al
guardar la cédula al perder el foco, el panel limpiaba el valor en memoria. Después,
al escribir el código de activación, el botón seguía deshabilitado porque la conexión
exige una cédula local no vacía.

El objetivo es conservar la cédula recién introducida en memoria hasta completar la
conexión, sin devolverla desde el servidor ni persistirla en texto plano.

## Flujo afectado

```text
EpsPanel
  -> POST /api/ips/link
  -> WAYLO_BACKEND_URL/internal/ips/link
  -> X-Waylo-Internal-Key
  -> Confianza /api/v1/integrations/agent/token
  -> estado active o error controlado
```

## Alcance

- Conservar el valor introducido de cédula después de un guardado exitoso.
- Mantener la validación de 5–12 dígitos y el código de seis dígitos.
- Mantener la cédula en memoria del componente; el endpoint de configuración solo
  devuelve una máscara.
- Documentar las variables server-side requeridas para que el BFF pueda alcanzar el
  backend adaptador.

Fuera de alcance: devolver la cédula descifrada al navegador, cambiar el contrato de
activación de Confianza o guardar el código de activación en Waylo durante esta acción.

## Contrato de despliegue

En Production y Preview, `waylo.ai` necesita `WAYLO_BACKEND_URL` apuntando al backend
adaptador y `WAYLO_BACKEND_KEY` con el mismo secreto server-side que
`waylo.ai-backend` expone como `WAYLO_INTERNAL_KEY`. Ninguna de esas variables debe
usar el prefijo `NEXT_PUBLIC_`.

## Validaciones de aceptación

- La cédula permanece disponible después de `PATCH /api/eps` exitoso.
- Con cédula válida y código válido, el botón se habilita y el POST usa ambos valores.
- La respuesta de configuración continúa mostrando solo la cédula enmascarada.
- Las pruebas de rutas BFF, adaptador y proveedor siguen cubriendo el intercambio sin
  exponer el token de Confianza.

## Riesgos y límites

- La memoria del navegador se pierde al recargar; en ese caso la persona debe volver a
  escribir la cédula, por diseño de privacidad.
- El código de activación sigue siendo de un solo uso y depende de que Confianza tenga
  alineadas `AGENT_API_KEY` y la clave que usa Waylo.
- Un despliegue `READY` no prueba el vínculo: también deben existir las variables,
  una fila activa de `confianza` en el catálogo Prisma y una base accesible.
