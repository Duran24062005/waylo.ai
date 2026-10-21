import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { googleConfig, OAUTH_STATE_COOKIE } from "@/lib/google";

export async function GET(request: Request) {
  const config = googleConfig(request);
  if (!config) return NextResponse.redirect(new URL("/login?error=google", request.url));

  const state = randomBytes(16).toString("hex");
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  }).toString();

  const response = NextResponse.redirect(url);
  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return response;
}
