import { describe, expect, it, vi } from "vitest";
import { ExtractError, extractText } from "@/lib/extract";
import { docxWith, pdfWith, xlsxWith } from "@/lib/fixtures";

const text = (value: string) => new TextEncoder().encode(value);

describe("extractText", () => {
  it("reads plain text", async () => {
    expect(await extractText(text("Hola, me duele la rodilla"), "txt")).toBe("Hola, me duele la rodilla");
    expect(await extractText(text("a,b\n1,2"), "csv")).toContain("1,2");
  });

  it("reads a PDF", async () => {
    expect(await extractText(pdfWith("Glucosa 90 mg"), "pdf")).toContain("Glucosa 90 mg");
  });

  it("reads a Word document", async () => {
    expect(await extractText(await docxWith("Formula medica de Ana"), "docx")).toContain("Formula medica de Ana");
  });

  it("reads each row of a spreadsheet, with the sheet name", async () => {
    const result = await extractText(
      await xlsxWith([
        ["Examen", "Valor"],
        ["Glucosa", "90"],
      ]),
      "xlsx",
    );
    expect(result).toContain("## Resultados");
    expect(result).toContain("Examen | Valor");
    expect(result).toContain("Glucosa | 90");
  });

  it("says a document with no text is empty, so a scan is told to be sent as a photo", async () => {
    await expect(extractText(text("   \n  "), "txt")).rejects.toMatchObject({ code: "empty" });
    await expect(extractText(pdfWith(""), "pdf")).rejects.toMatchObject({ code: "empty" });
  });

  it("says a damaged file is unreadable, without leaking the reader's error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const error = await extractText(text("%PDF-1.4 esto no es un pdf de verdad"), "pdf").catch((caught) => caught);
    expect(error).toBeInstanceOf(ExtractError);
    expect(error.code).toBe("unreadable");
    await expect(extractText(text("PK\u0003\u0004 roto"), "docx")).rejects.toMatchObject({ code: "unreadable" });
  });
});
