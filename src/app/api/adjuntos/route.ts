import { NextResponse } from "next/server";
import { clampText, cleanName, isImageFormat, MAX_DOCUMENT_BYTES, sniffFormat, type DocumentFormat } from "@/lib/attachments";
import { ExtractError, extractText } from "@/lib/extract";

// Reading a long PDF takes a moment.
export const maxDuration = 30;

/** Codes, not texts: the page says them in the language it is showing. */
const refuse = (code: "invalid" | "unsupported" | "too_large" | "empty" | "unreadable", status: number) =>
  NextResponse.json({ error: code }, { status });

/**
 * Reads one document the patient attached (PDF, Word, Excel, text) and answers with its text.
 * Nothing is stored: the file lives in memory for this request only. Photos never come here; the browser sends
 * them to the triage route itself.
 */
export async function POST(request: Request) {
  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return refuse("invalid", 400);
  }
  if (!(file instanceof File) || file.size === 0) return refuse("invalid", 400);
  if (file.size > MAX_DOCUMENT_BYTES) return refuse("too_large", 413);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const name = cleanName(file.name);
  // What the file is comes from its bytes: a renamed file is judged by what it really holds.
  const format = sniffFormat(bytes, name);
  if (!format || isImageFormat(format)) return refuse("unsupported", 415);

  try {
    const { text, truncated } = clampText(await extractText(bytes, format as DocumentFormat));
    if (!text) return refuse("empty", 422);
    return NextResponse.json({ name, text, truncated });
  } catch (error) {
    if (error instanceof ExtractError) return refuse(error.code, 422);
    throw error;
  }
}
