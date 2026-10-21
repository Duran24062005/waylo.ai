import { MapPin, Phone } from "lucide-react";
import type { OrientationCard as Card } from "@/lib/types";

const BADGE: Record<Card["nivel"], string> = {
  urgencias: "bg-red-700 text-white",
  prioritaria: "bg-amber-400 text-amber-950",
  general: "bg-emerald-700 text-white",
};

export function OrientationCard({ card }: { card: Card }) {
  return (
    <section className="rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-sm" aria-label="Orientación">
      <p className="text-sm font-bold uppercase tracking-wide text-slate-600">Nivel de atención recomendado</p>
      <p className={`mt-2 inline-flex rounded-full px-4 py-2 text-lg font-bold ${BADGE[card.nivel]}`}>{card.nivelLabel}</p>

      <h2 className="mt-4 text-base font-bold">Por qué</h2>
      <p className="mt-1 text-lg leading-snug">{card.justificacion}</p>

      <h2 className="mt-4 text-base font-bold">Qué debes llevar</h2>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-lg">
        {card.queLlevar.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      {card.sedes.length > 0 && (
        <>
          <h2 className="mt-4 text-base font-bold">Sedes de ejemplo</h2>
          <ul className="mt-2 space-y-3">
            {card.sedes.map((site) => (
              <li key={site.id} className="rounded-xl bg-slate-100 p-3">
                <p className="text-lg font-bold">{site.nombre}</p>
                <p className="mt-1 flex items-start gap-2 text-base">
                  <MapPin className="mt-1 shrink-0" size={18} aria-hidden />
                  {site.direccion}, {site.ciudad}
                </p>
                <p className="mt-1 flex items-center gap-2 text-base">
                  <Phone size={18} aria-hidden />
                  {site.telefono} · {site.horario}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="mt-4 text-sm leading-snug text-slate-700">{card.aviso}</p>
    </section>
  );
}
