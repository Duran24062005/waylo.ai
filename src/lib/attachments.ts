/** What a patient can attach to a message, and the checks every file goes through before the AI sees it. */

export const MAX_ATTACHMENTS = 3;
/** Documents go to the server as they are, and a serverless request body stops near 4.5 MB. */
export const MAX_DOCUMENT_BYTES = 3 * 1024 * 1024;
/** A photo, once the browser has shrunk it. Three of them still fit in one request. */
export const MAX_IMAGE_BYTES = 900 * 1024;
/** A photo as the camera gives it, before it is shrunk. */
export const MAX_SOURCE_IMAGE_BYTES = 20 * 1024 * 1024;
/** The text kept from one document. A longer one is cut, and the patient and the AI are told. */
export const MAX_DOCUMENT_CHARS = 15_000;
/** The text of all documents together that goes to the AI in one request, newest first. */
export const MAX_HISTORY_DOCUMENT_CHARS = 40_000;

/** An unzipped office file may not claim to be bigger than this, nor hold more files: a zip bomb is a tiny file. */
const MAX_UNZIPPED_BYTES = 40 * 1024 * 1024;
const MAX_ZIP_ENTRIES = 2000;

export type ImageFormat = "png" | "jpeg" | "webp";
export type DocumentFormat = "pdf" | "docx" | "xlsx" | "txt" | "csv";
export type FileFormat = ImageFormat | DocumentFormat;

export const IMAGE_MEDIA_TYPES: Record<ImageFormat, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

/** What the file picker offers. The real type is always decided from the bytes, never from this. */
export const ACCEPT = "image/png,image/jpeg,image/webp,.pdf,.docx,.xlsx,.txt,.csv";

export function isImageFormat(format: FileFormat | null): format is ImageFormat {
  return format === "png" || format === "jpeg" || format === "webp";
}

const startsWith = (bytes: Uint8Array, signature: number[], at = 0) =>
  signature.every((byte, index) => bytes[at + index] === byte);

interface ZipEntry {
  name: string;
}

/** The files inside a zip, read from its table of contents. Null when it is not a safe zip. */
function zipEntries(bytes: Uint8Array): ZipEntry[] | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  // The end record sits in the last bytes, before an optional comment of up to 64 KB.
  let end = -1;
  for (let at = bytes.length - 22; at >= Math.max(0, bytes.length - 22 - 65535); at -= 1) {
    if (view.getUint32(at, true) === 0x06054b50) {
      end = at;
      break;
    }
  }
  if (end === -1) return null;

  const count = view.getUint16(end + 10, true);
  let at = view.getUint32(end + 16, true);
  if (count === 0xffff || at === 0xffffffff || count > MAX_ZIP_ENTRIES) return null;

  const entries: ZipEntry[] = [];
  let unzipped = 0;
  for (let index = 0; index < count; index += 1) {
    if (at + 46 > bytes.length || view.getUint32(at, true) !== 0x02014b50) return null;
    const size = view.getUint32(at + 24, true);
    const nameLength = view.getUint16(at + 28, true);
    const extraLength = view.getUint16(at + 30, true);
    const commentLength = view.getUint16(at + 32, true);
    if (size === 0xffffffff || at + 46 + nameLength > bytes.length) return null;
    unzipped += size;
    if (unzipped > MAX_UNZIPPED_BYTES) return null;
    entries.push({ name: new TextDecoder().decode(bytes.subarray(at + 46, at + 46 + nameLength)) });
    at += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

function looksLikeText(bytes: Uint8Array): boolean {
  const head = bytes.subarray(0, 4096);
  // Tabs, line breaks and form feeds are text. Any other control byte means a binary file.
  if (head.some((byte) => byte < 9 || (byte > 13 && byte < 32))) return false;
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return true;
  } catch {
    return false;
  }
}

/** What a file really is, from its first bytes. The name only breaks the tie between text files. Null when unsupported. */
export function sniffFormat(bytes: Uint8Array, name: string): FileFormat | null {
  if (bytes.length === 0) return null;
  // A very short file can still be a note: only the text check applies to it.
  if (bytes.length < 12) return looksLikeText(bytes) ? (/\.csv$/i.test(name) ? "csv" : "txt") : null;
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "jpeg";
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return "webp";
  // PDF readers accept the header a little way into the file.
  for (let at = 0; at < Math.min(1024, bytes.length - 5); at += 1) {
    if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d], at)) return "pdf";
  }
  if (startsWith(bytes, [0x50, 0x4b, 0x03, 0x04])) {
    const entries = zipEntries(bytes);
    if (!entries) return null;
    const names = new Set(entries.map((entry) => entry.name));
    if (names.has("word/document.xml")) return "docx";
    if (names.has("xl/workbook.xml")) return "xlsx";
    return null;
  }
  if (looksLikeText(bytes)) return /\.csv$/i.test(name) ? "csv" : "txt";
  return null;
}

/** A file name that is safe to show and to put in the AI's instructions. */
export function cleanName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  const cleaned = base.replace(/[\u0000-\u001f\u007f<>"'`]/g, "").replace(/\s+/g, " ").trim().slice(0, 80);
  return cleaned || "archivo";
}

/** Plain text from a document: no control characters, no runs of blank lines, cut at the limit. */
export function clampText(raw: string, max = MAX_DOCUMENT_CHARS): { text: string; truncated: boolean } {
  const tidy = raw
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (tidy.length <= max) return { text: tidy, truncated: false };
  return { text: tidy.slice(0, max).trimEnd(), truncated: true };
}

/** A file as it travels from the browser to the triage route. Documents are already text, photos a data URL. */
export interface WireAttachment {
  name: string;
  kind: "image" | "document";
  text?: string;
  dataUrl?: string;
  truncated?: boolean;
}

/** A checked attachment, ready for the AI. */
export type ModelAttachment =
  | { kind: "document"; name: string; text: string; truncated: boolean }
  | { kind: "image"; name: string; mediaType: string; bytes: Uint8Array }
  /** A photo from an earlier message: the browser keeps only its name, and the replies already told what it showed. */
  | { kind: "past-image"; name: string };

const DATA_URL = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/;

function decodeBase64(base64: string): Uint8Array {
  return Uint8Array.from(Buffer.from(base64, "base64"));
}

/**
 * Checks what a request says it attached. The browser already did this, but a request can be written by hand,
 * so the server never takes the file kind, size or type on trust. Null when anything is wrong.
 */
export function sanitizeAttachments(raw: unknown): ModelAttachment[] | null {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw) || raw.length > MAX_ATTACHMENTS) return null;

  const checked: ModelAttachment[] = [];
  for (const item of raw as Partial<WireAttachment>[]) {
    if (!item || typeof item !== "object" || typeof item.name !== "string") return null;
    const name = cleanName(item.name);

    if (item.kind === "document") {
      if (typeof item.text !== "string" || item.text.length > MAX_DOCUMENT_CHARS * 2) return null;
      const { text, truncated } = clampText(item.text);
      if (!text) return null;
      checked.push({ kind: "document", name, text, truncated: truncated || item.truncated === true });
    } else if (item.kind === "image" && item.dataUrl === undefined) {
      checked.push({ kind: "past-image", name });
    } else if (item.kind === "image") {
      const match = typeof item.dataUrl === "string" ? DATA_URL.exec(item.dataUrl) : null;
      if (!match || match[2].length > MAX_IMAGE_BYTES * 1.4) return null;
      const bytes = decodeBase64(match[2]);
      const format = sniffFormat(bytes, name);
      // The bytes must be the image type the data URL claims, and no more than the limit.
      if (!isImageFormat(format) || IMAGE_MEDIA_TYPES[format] !== match[1] || bytes.length > MAX_IMAGE_BYTES) return null;
      checked.push({ kind: "image", name, mediaType: match[1], bytes });
    } else {
      return null;
    }
  }
  return checked;
}

/** A document as the AI reads it. The tags tell it where the patient's file starts and ends. */
export function documentBlock({ name, text, truncated }: { name: string; text: string; truncated: boolean }): string {
  // The file's own text can't close the tag early and pass for the end of the file.
  const safe = text.replace(/<(\/?)documento/gi, "‹$1documento");
  return `<documento nombre="${name}">\n${safe}${truncated ? "\n[…el texto sigue, se recortó por tamaño]" : ""}\n</documento>`;
}
