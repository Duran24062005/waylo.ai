export const OAUTH_STATE_COOKIE = "waylo_oauth_state";

export function googleConfig(request: Request) {
  const clientId = process.env.AUTH_GOOGLE_ID;
  const clientSecret = process.env.AUTH_GOOGLE_SECRET;
  if (!clientId || !clientSecret) return null;
  // Same convention as Auth.js, so a redirect URI registered for it keeps working.
  const redirectUri = `${new URL(request.url).origin}/api/auth/callback/google`;
  return { clientId, clientSecret, redirectUri };
}
