import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Falta DATABASE_URL. Ejecuta: npm run db:migrate");
  process.exit(1);
}

const sql = neon(url);

await sql`
  create table if not exists personas (
    id uuid primary key default gen_random_uuid(),
    nombre text not null,
    email text not null,
    password_hash text not null,
    fecha_nacimiento date not null,
    acepta_datos_en timestamptz not null,
    creado_en timestamptz not null default now()
  )
`;
await sql`create unique index if not exists personas_email_uq on personas (lower(email))`;

const [{ total }] = await sql`select count(*)::int as total from personas`;
console.log(`Esquema listo. Personas registradas: ${total}`);
