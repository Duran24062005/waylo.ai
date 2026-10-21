import { MapPin, Phone } from "lucide-react";
import type { OrientationCard as Orientation } from "@/lib/types";

const BADGE: Record<Orientation["nivel"], string> = {
  urgencias: "bg-red-700 text-white",
  prioritaria: "bg-amber-400 text-slate-950",
  general: "bg-emerald-700 text-white",
};

export function OrientationCard({ card }: { card: Orientation }) {
  return (
    <article className="rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-sm">
      <p className="text-base font-semibold text-slate-700">Nivel de atención recomendado</p>
      <p className={`mt-2 inline-flex rounded-full px-4 py-2 text-lg font-bold ${BADGE[card.nivel]}`}>
        {card.nivelLabel}
      </p>
      <h2 className="mt-4 text-lg font-bold">Por qué</h2>
      <p className="mt-1 text-lg leading-relaxed">{card.justificacion}</p>
      <h2 className="mt-4 text-lg font-bold">Qué debes llevar</h2>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-lg">
        {card.queLlevar.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <h2 className="mt-4 text-lg font-bold">Sedes de ejemplo</h2>
      <ul className="mt-2 space-y-3">
        {card.sedes.map((site) => (
          <li key={site.id} className="rounded-xl bg-slate-100 p-3">
            <p className="text-lg font-bold">{site.nombre}</p>
            <p className="mt-1 flex items-start gap-2 text-base">
              <MapPin aria-hidden className="mt-1 size-4 shrink-0" />
              {site.direccion}, {site.ciudad}
            </p>
            <p className="mt-1 flex items-center gap-2 text-base">
              <Phone aria-hidden className="size-4 shrink-0" />
              {site.telefono} · {site.horario}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-base leading-relaxed text-slate-700">{card.aviso}</p>
    </article>
  );
}
