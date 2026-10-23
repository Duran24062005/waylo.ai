import { beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_DOCUMENT_BYTES } from "@/lib/attachments";
import { docxWith, PNG_1X1, pdfWith } from "@/lib/fixtures";
import { POST } from "@/app/api/adjuntos/route";

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

function upload(bytes: Uint8Array | null, name = "archivo.pdf", type = "application/octet-stream") {
  const form = new FormData();
  if (bytes) form.append("file", new File([bytes as BlobPart], name, { type }));
  return new Request("http://localhost/api/adjuntos", { method: "POST", body: form });
}

describe("POST /api/adjuntos", () => {
  it("answers with the text of a PDF, a Word document and a text file", async () => {
    const pdf = await (await POST(upload(pdfWith("Glucosa 90 mg"), "examen.pdf"))).json();
    expect(pdf).toMatchObject({ name: "examen.pdf", truncated: false });
    expect(pdf.text).toContain("Glucosa 90 mg");

    const docx = await (await POST(upload(await docxWith("Formula de Ana"), "formula.docx"))).json();
    expect(docx.text).toContain("Formula de Ana");

    const txt = await (await POST(upload(new TextEncoder().encode("Me duele la rodilla"), "nota.txt"))).json();
    expect(txt.text).toBe("Me duele la rodilla");
  });

  it("judges the file by its bytes, not by its name or declared type", async () => {
    // A text file dressed as a PDF is still read, as text.
    const dressed = await POST(upload(new TextEncoder().encode("solo texto"), "falso.pdf", "application/pdf"));
    expect((await dressed.json()).text).toBe("solo texto");

    // A program dressed as a PDF is refused.
    const program = await POST(upload(Uint8Array.from([0x4d, 0x5a, 0x90, 0, 3, 0, 0, 0, 4, 0]), "virus.pdf", "application/pdf"));
    expect(program.status).toBe(415);
    expect(await program.json()).toEqual({ error: "unsupported" });
  });

  it("does not take photos: the browser sends those itself", async () => {
    expect((await POST(upload(PNG_1X1, "foto.png", "image/png"))).status).toBe(415);
  });

  it("refuses a missing, empty or oversized file", async () => {
    expect((await POST(upload(null))).status).toBe(400);
    expect((await POST(upload(new Uint8Array(0), "vacio.txt"))).status).toBe(400);
    const big = new Uint8Array(MAX_DOCUMENT_BYTES + 1).fill(97);
    const response = await POST(upload(big, "grande.txt"));
    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ error: "too_large" });
  });

  it("answers 'empty' for a document with no text and 'unreadable' for a damaged one", async () => {
    const empty = await POST(upload(new TextEncoder().encode("     "), "blanco.txt"));
    expect(empty.status).toBe(422);
    expect(await empty.json()).toEqual({ error: "empty" });

    const damaged = await POST(upload(new TextEncoder().encode("%PDF-1.4 roto del todo"), "roto.pdf"));
    expect(damaged.status).toBe(422);
    expect(await damaged.json()).toEqual({ error: "unreadable" });
  });

  it("rejects a request that is not a form", async () => {
    const response = await POST(new Request("http://localhost/api/adjuntos", { method: "POST", body: "no es un formulario" }));
    expect(response.status).toBe(400);
  });
});
