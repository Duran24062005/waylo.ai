import type { Instrumentation } from "next";

/** Next calls this for every error nobody caught: routes, pages and actions. */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const { sendErrorReport } = await import("@/lib/error-report");
  await sendErrorReport(`${context.routeType} ${context.routePath}`, error, {
    método: request.method,
    // The query string can carry codes and tokens, so only the path is sent.
    ruta: request.path.split("?")[0],
  });
};
