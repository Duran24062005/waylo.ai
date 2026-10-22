import { HugeiconsIcon } from "@hugeicons/react";
import { MapPinIcon, PhoneIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import type { OrientationCard as Card } from "@/lib/types";

const BADGE: Record<Card["nivel"], string> = {
  urgencias: "bg-[#c62828] text-white",
  prioritaria: "bg-warning text-warning-foreground",
  general: "bg-success text-success-foreground",
};

export function OrientationCard({ card }: { card: Card }) {
  const urgent = card.nivel === "urgencias";

  return (
    <section
      className={cn(
        "w-full max-w-xl rounded-2xl bg-surface-raised p-5 text-left shadow-soft",
        // Urgencias keeps a danger outline: this is a safety cue, not decoration.
        urgent && "ring-2 ring-[#c62828]",
      )}
      aria-label="Orientación"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-heading text-xs font-medium uppercase tracking-wide text-text-muted">
          Nivel de atención recomendado
        </p>
        <p className={cn("rounded-full px-3 py-1 font-heading text-sm font-semibold", BADGE[card.nivel])}>
          {card.nivelLabel}
        </p>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <h2 className="font-heading text-sm font-semibold text-text">Por qué</h2>
          <p className="mt-1 text-sm leading-relaxed text-text">{card.justificacion}</p>
        </div>
        <div>
          <h2 className="font-heading text-sm font-semibold text-text">Qué debes llevar</h2>
          <ul className="mt-1.5 space-y-1.5">
            {card.queLlevar.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-text">
                <HugeiconsIcon icon={Tick02Icon} className="mt-0.5 shrink-0 text-text-muted" size={16} strokeWidth={2.25} aria-hidden />
                <span className="min-w-0 break-words">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {card.sedes.length > 0 && (
        <div className="mt-4">
          <h2 className="font-heading text-sm font-semibold text-text">Lugares de ejemplo</h2>
          <ul className="mt-2 space-y-2">
            {card.sedes.map((site) => (
              <li key={site.id} className="rounded-xl bg-surface px-3.5 py-3 shadow-inset">
                <p className="font-heading text-sm font-semibold text-text">{site.nombre}</p>
                <p className="mt-1 flex items-start gap-2 text-xs text-text-muted">
                  <HugeiconsIcon icon={MapPinIcon} className="mt-px shrink-0" size={14} strokeWidth={2} aria-hidden />
                  <span className="min-w-0 break-words">
                    {site.direccion}, {site.ciudad}
                  </span>
                </p>
                <p className="mt-0.5 flex items-start gap-2 text-xs text-text-muted">
                  <HugeiconsIcon icon={PhoneIcon} className="mt-px shrink-0" size={14} strokeWidth={2} aria-hidden />
                  <span className="min-w-0 break-words">
                    {site.telefono} · {site.horario}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-4 text-xs leading-relaxed text-text-muted">{card.aviso}</p>
    </section>
  );
}
