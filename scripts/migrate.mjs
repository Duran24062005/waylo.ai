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

// Google sign-in: those accounts have no password and no birth date.
await sql`alter table personas alter column password_hash drop not null`;
await sql`alter table personas alter column fecha_nacimiento drop not null`;
await sql`alter table personas add column if not exists google_id text`;
await sql`create unique index if not exists personas_google_id_uq on personas (google_id) where google_id is not null`;
console.log("Columnas para Google listas.");

// Settings: profile details and the preferences that follow the account between devices.
await sql`alter table personas add column if not exists nombre_preferido text`;
await sql`alter table personas add column if not exists sexo text`;
await sql`alter table personas add column if not exists ciudad text`;
await sql`alter table personas add column if not exists nacionalidad text`;
await sql`alter table personas add column if not exists idioma text`;
await sql`alter table personas add column if not exists voz text`;
await sql`alter table personas add column if not exists idioma_live text`;
console.log("Columnas de perfil y preferencias listas.");

// Active sessions: one row per sign-in, so each can be listed and closed on its own.
await sql`
  create table if not exists sesiones (
    id uuid primary key default gen_random_uuid(),
    persona_id uuid not null references personas(id) on delete cascade,
    creada_en timestamptz not null default now(),
    ultima_actividad timestamptz not null default now(),
    expira_en timestamptz not null,
    dispositivo text not null default ''
  )
`;
await sql`create index if not exists sesiones_persona_idx on sesiones (persona_id)`;
console.log("Tabla de sesiones lista.");

// Usage of registered accounts: replies today and this month, and when a wait ends.
await sql`
  create table if not exists uso (
    persona_id uuid primary key references personas(id) on delete cascade,
    dia date not null,
    usadas_dia int not null default 0,
    bloqueado_hasta timestamptz,
    mes text not null,
    usadas_mes int not null default 0
  )
`;
console.log("Tabla de uso lista.");

// EPS: the insurer the person picked, their ID number and the temporary code the insurer sent, and the authorization.
// The ID number and the code are stored encrypted (see src/lib/secrets.ts), never as plain text.
await sql`alter table personas add column if not exists eps text`;
await sql`alter table personas add column if not exists eps_cedula_cifrada text`;
await sql`alter table personas add column if not exists eps_codigo_cifrado text`;
await sql`alter table personas add column if not exists eps_codigo_expira timestamptz`;
await sql`alter table personas add column if not exists eps_autoriza_en timestamptz`;
console.log("Columnas de EPS listas.");
