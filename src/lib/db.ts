import { neon } from "@neondatabase/serverless";

let client: ReturnType<typeof neon> | undefined;

export function getSql() {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("Falta DATABASE_URL");
    client = neon(url);
  }
  return client;
}
