import { beforeEach, describe, expect, it, vi } from "vitest";

const jar: Record<string, string> = {};
const getSession = vi.fn();
const getProfile = vi.fn();
const listSessions = vi.fn();
const readUsage = vi.fn();
const getEpsState = vi.fn();

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (jar[name] ? { value: jar[name] } : undefined) }),
  headers: async () => ({ get: () => null }),
}));
vi.mock("@/lib/session", () => ({ getSession: () => getSession() }));
vi.mock("@/lib/profile-db", () => ({
  getProfile: (...args: unknown[]) => getProfile(...args),
  listSessions: (...args: unknown[]) => listSessions(...args),
}));
vi.mock("@/lib/eps-db", () => ({ getEpsState: (...args: unknown[]) => getEpsState(...args) }));
vi.mock("@/lib/usage", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/usage")>()),
  readUsage: (...args: unknown[]) => readUsage(...args),
}));

import { GET } from "@/app/api/configuracion/route";

const PROFILE = { nombre: "Ana", apodo: "Ani", email: "ana@correo.com", sexo: null, ciudad: null, nacionalidad: null, tienePassword: true };
const SESSIONS = [{ id: "s1", dispositivo: "Chrome · Windows", creadaEn: 1, ultimaActividad: 2, actual: true }];

beforeEach(() => {
  for (const key of Object.keys(jar)) delete jar[key];
  getSession.mockReset().mockResolvedValue({ id: "u1", nombre: "Ana", apodo: "Ani", sid: "s1" });
  getProfile.mockReset().mockResolvedValue(PROFILE);
  listSessions.mockReset().mockResolvedValue(SESSIONS);
  readUsage.mockReset().mockResolvedValue(null);
  getEpsState.mockReset().mockResolvedValue({ eps: "confianza", cedula: "••••••3456", codigoVenceEn: null, autorizado: true, acceso: false });
});

describe("GET /api/configuracion", () => {
  it("gives a signed-in account its profile, its sessions and its usage, and the device's voice choices", async () => {
    jar.waylo_voice = "masculino";
    jar.waylo_live_lang = "en";

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toMatchObject({
      signedIn: true,
      profile: PROFILE,
      sessions: SESSIONS,
      eps: { eps: "confianza", cedula: "••••••3456", autorizado: true, acceso: false },
      voice: "masculino",
      liveLanguage: "en",
      usage: { dayUsed: 0, dayLimit: 100, monthUsed: 0, monthLimit: 2000, blocked: null },
    });
    expect(listSessions).toHaveBeenCalledWith("u1", "s1");
  });

  it("gives a visitor only the device's choices, with no account data", async () => {
    getSession.mockResolvedValue(null);

    const body = await (await GET()).json();

    expect(body).toEqual({ signedIn: false, voice: "femenino", liveLanguage: "auto", profile: null, sessions: [], usage: null, eps: null });
    expect(getProfile).not.toHaveBeenCalled();
    expect(listSessions).not.toHaveBeenCalled();
  });

  it("falls back to the defaults when the voice cookies are not valid", async () => {
    getSession.mockResolvedValue(null);
    jar.waylo_voice = "robot";
    jar.waylo_live_lang = "xx";

    const body = await (await GET()).json();

    expect(body).toMatchObject({ voice: "femenino", liveLanguage: "auto" });
  });

  it("answers 500 when the database fails, so the window can offer to try again", async () => {
    getProfile.mockRejectedValue(new Error("db down"));

    const response = await GET();

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "server" });
  });
});
