import { describe, expect, it } from "vitest";
import { CITIES, isColombianCity } from "@/data/ciudades";
import { COUNTRY_CODES, countryOptions, isCountryCode } from "@/data/paises";

describe("Colombian cities", () => {
  it("lists main cities with their department, sorted and without repeats", () => {
    expect(CITIES.length).toBeGreaterThan(130);
    expect(new Set(CITIES).size).toBe(CITIES.length);
    expect(CITIES).toContain("Bogotá, Bogotá D.C.");
    expect(CITIES).toContain("Medellín, Antioquia");
    expect(CITIES).toContain("Cali, Valle del Cauca");
    expect(CITIES).toContain("Leticia, Amazonas");
  });

  it("accepts only the listed options", () => {
    expect(isColombianCity("Cúcuta, Norte de Santander")).toBe(true);
    expect(isColombianCity("Cúcuta")).toBe(false);
    expect(isColombianCity("Madrid, España")).toBe(false);
    expect(isColombianCity(42)).toBe(false);
  });
});

describe("countries", () => {
  it("has the 193 UN members plus the Holy See, Palestine and Taiwan, without repeats", () => {
    expect(COUNTRY_CODES).toHaveLength(196);
    expect(new Set(COUNTRY_CODES).size).toBe(196);
  });

  it("names every code in each language, never falling back to the bare code", () => {
    for (const locale of ["es", "en", "pt"]) {
      const options = countryOptions(locale);
      expect(options).toHaveLength(196);
      expect(options.filter((option) => option.name === option.code)).toEqual([]);
    }
  });

  it("uses the names of each language", () => {
    const name = (locale: string, code: string) => countryOptions(locale).find((o) => o.code === code)?.name;
    expect(name("es", "CO")).toBe("Colombia");
    expect(name("en", "DE")).toBe("Germany");
    expect(name("es", "DE")).toBe("Alemania");
    expect(name("pt", "DE")).toBe("Alemanha");
  });

  it("accepts only listed codes", () => {
    expect(isCountryCode("CO")).toBe(true);
    expect(isCountryCode("co")).toBe(false);
    expect(isCountryCode("ZZ")).toBe(false);
  });
});
