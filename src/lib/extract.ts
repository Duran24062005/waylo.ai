import type { DocumentFormat } from "@/lib/attachments";

/** Why a document gave no text: `empty` has none to read (a scan), `unreadable` is damaged or protected. */
export class ExtractError extends Error {
  constructor(readonly code: "empty" | "unreadable") {
    super(code);
  }
}

const MAX_PDF_PAGES = 100;
/** A spreadsheet is read only as far as it can matter: a few hundred rows of each sheet. */
const MAX_SHEET_ROWS = 500;
const MAX_RAW_CHARS = 200_000;

async function fromPdf(bytes: Uint8Array): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  // The reader takes ownership of the buffer it is given, so it gets a copy.
  const pdf = await getDocumentProxy(new Uint8Array(bytes));
  if (pdf.numPages > MAX_PDF_PAGES) throw new ExtractError("unreadable");
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}

async function fromDocx(bytes: Uint8Array): Promise<string> {
  const mammoth = await import("mammoth");
  const { value } = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
  return value;
}

async function fromXlsx(bytes: Uint8Array): Promise<string> {
  const { default: readXlsxFile } = await import("read-excel-file/node");
  const sheets = await readXlsxFile(Buffer.from(bytes));
  const parts: string[] = [];
  let size = 0;
  for (const { sheet, data } of sheets) {
    const rows = data
      .slice(0, MAX_SHEET_ROWS)
      .map((row) => row.map((cell) => (cell === null || cell === undefined ? "" : String(cell))).join(" | ").trimEnd())
      .filter(Boolean);
    if (rows.length === 0) continue;
    const part = `## ${sheet}\n${rows.join("\n")}`;
    parts.push(part);
    size += part.length;
    if (size > MAX_RAW_CHARS) break;
  }
  return parts.join("\n\n");
}

/** The text of a document, whatever its format. Throws `ExtractError` when there is none to read. */
export async function extractText(bytes: Uint8Array, format: DocumentFormat): Promise<string> {
  let text: string;
  try {
    if (format === "pdf") text = await fromPdf(bytes);
    else if (format === "docx") text = await fromDocx(bytes);
    else if (format === "xlsx") text = await fromXlsx(bytes);
    else text = new TextDecoder("utf-8").decode(bytes);
  } catch (error) {
    if (error instanceof ExtractError) throw error;
    console.error("[adjuntos] could not read a", format, "file:", error instanceof Error ? error.message : error);
    throw new ExtractError("unreadable");
  }
  if (!text.trim()) throw new ExtractError("empty");
  return text;
}
