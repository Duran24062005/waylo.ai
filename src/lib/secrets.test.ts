import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { decryptSecret, encryptSecret } from "@/lib/secrets";

beforeEach(() => {
  vi.stubEnv("AUTH_SECRET", "secreto-de-prueba");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("stored secrets", () => {
  it("read back what was written, in any language", () => {
    for (const text of ["1032456789", "AB-12cd", "contraseña ñandú 😀", "x"]) {
      expect(decryptSecret(encryptSecret(text))).toBe(text);
    }
  });

  it("do not show the text, and never look the same twice", () => {
    const first = encryptSecret("1032456789");
    const second = encryptSecret("1032456789");

    expect(first).not.toContain("1032456789");
    expect(first).not.toBe(second);
    expect(first.startsWith("v1.")).toBe(true);
  });

  it("are refused when they were changed, even by one character", () => {
    const [version, iv, tag, body] = encryptSecret("1032456789").split(".");
    // The first character carries six full bits; the last one of a base64 text can have bits that decode to nothing.
    const flipped = (value: string) => `${value.startsWith("A") ? "B" : "A"}${value.slice(1)}`;

    expect(decryptSecret([version, iv, tag, flipped(body)].join("."))).toBeNull();
    expect(decryptSecret([version, iv, flipped(tag), body].join("."))).toBeNull();
    expect(decryptSecret([version, flipped(iv), tag, body].join("."))).toBeNull();
  });

  it("cannot be read with another secret", () => {
    const token = encryptSecret("1032456789");
    vi.stubEnv("AUTH_SECRET", "otro-secreto");

    expect(decryptSecret(token)).toBeNull();
  });

  it("answer null to anything that is not one, instead of failing", () => {
    for (const token of [null, undefined, "", "texto", "v1.a.b", "v2.a.b.c", "v1...", "1032456789"]) {
      expect(decryptSecret(token), String(token)).toBeNull();
    }
  });

  it("need the secret to exist", () => {
    vi.stubEnv("AUTH_SECRET", "");
    expect(() => encryptSecret("x")).toThrow();
  });
});
