import { MAX_DOCUMENT_BYTES, MAX_IMAGE_BYTES, MAX_SOURCE_IMAGE_BYTES } from "@/lib/attachments";

/** Why a file was not taken. The chat says each one in the language it is showing. */
export type AttachFailure = "unsupported" | "too_large" | "empty" | "failed";

export class AttachError extends Error {
  constructor(readonly failure: AttachFailure) {
    super(failure);
  }
}

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

/** Biggest side and quality to try, from the best to the smallest, until the photo fits the limit. */
const IMAGE_STEPS: readonly (readonly [side: number, quality: number])[] = [
  [1600, 0.85],
  [1280, 0.8],
  [1024, 0.7],
  [800, 0.6],
  [640, 0.5],
];

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function isPhoto(file: File): boolean {
  return IMAGE_TYPES.includes(file.type);
}

/** A photo made small enough to send: a phone's photo is several MB, and the AI sees no more than this. */
export async function preparePhoto(file: File): Promise<string> {
  if (!isPhoto(file)) throw new AttachError("unsupported");
  if (file.size > MAX_SOURCE_IMAGE_BYTES) throw new AttachError("too_large");

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new AttachError("failed");
  }

  try {
    for (const [side, quality] of IMAGE_STEPS) {
      const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new AttachError("failed");
      // JPEG has no transparency: a transparent PNG would turn black.
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      const blob = await toBlob(canvas, quality);
      if (blob && blob.size <= MAX_IMAGE_BYTES) return await readAsDataUrl(blob);
    }
  } finally {
    bitmap.close();
  }
  throw new AttachError("too_large");
}

/** The text of a PDF, Word, Excel or text file, read by the server. */
export async function readDocument(file: File): Promise<{ text: string; truncated: boolean }> {
  if (file.size === 0) throw new AttachError("empty");
  if (file.size > MAX_DOCUMENT_BYTES) throw new AttachError("too_large");

  const form = new FormData();
  form.append("file", file);
  let response: Response;
  try {
    response = await fetch("/api/adjuntos", { method: "POST", body: form });
  } catch {
    throw new AttachError("failed");
  }
  if (response.ok) {
    const body = (await response.json()) as { text: string; truncated?: boolean };
    return { text: body.text, truncated: Boolean(body.truncated) };
  }

  const { error } = (await response.json().catch(() => ({}))) as { error?: string };
  if (error === "unsupported") throw new AttachError("unsupported");
  if (error === "too_large") throw new AttachError("too_large");
  if (error === "empty") throw new AttachError("empty");
  throw new AttachError("failed");
}
