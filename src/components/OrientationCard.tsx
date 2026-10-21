import { HugeiconsIcon } from "@hugeicons/react";
import { MapPinIcon, PhoneIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import type { OrientationCard as Card } from "@/lib/types";

const BADGE: Record<Card["nivel"], string> = {
  urgencias: "bg-danger text-danger-foreground",
  prioritaria: "bg-warning text-warning-foreground",
  general: "bg-success text-success-foreground",
};

export function OrientationCard({ card }: { card: Card }) {
  const urgent = card.nivel === "urgencias";

  return (
    <section
      className={cn(
        "rounded-xl bg-surface-raised p-6 shadow-raised sm:p-8",
        // Urgencias keeps a strong danger outline, as a shadow ring: this is a safety cue, not decoration.
        urgent && "ring-3 ring-danger",
      )}
      aria-label="Orientación"
    >
      <p className="font-heading text-caption font-medium uppercase tracking-wide text-text-muted">
        Nivel de atención recomendado
      </p>
      <p
        className={cn(
          "mt-3 inline-flex rounded-full px-5 py-2 font-heading text-body-lg font-semibold shadow-soft",
          BADGE[card.nivel],
        )}
      >
        {card.nivelLabel}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="font-heading text-body-lg font-semibold text-text">Por qué</h2>
          <p className="mt-2 text-body text-text">{card.justificacion}</p>
        </div>
        <div>
          <h2 className="font-heading text-body-lg font-semibold text-text">Qué debes llevar</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-body text-text marker:text-text-muted">
            {card.queLlevar.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      {card.sedes.length > 0 && (
        <>
          <h2 className="mt-6 font-heading text-body-lg font-semibold text-text">Lugares de ejemplo</h2>
          <ul className="mt-3 grid gap-4 md:grid-cols-2">
            {card.sedes.map((site) => (
              <li key={site.id} className="rounded-lg bg-surface p-4 shadow-inset">
                <p className="font-heading text-body font-semibold text-text">{site.nombre}</p>
                <p className="mt-2 flex items-start gap-2 text-caption text-text">
                  <HugeiconsIcon icon={MapPinIcon} className="mt-1 shrink-0" size={18} strokeWidth={2} aria-hidden />
                  <span className="min-w-0 break-words">
                    {site.direccion}, {site.ciudad}
                  </span>
                </p>
                <p className="mt-1 flex items-start gap-2 text-caption text-text">
                  <HugeiconsIcon icon={PhoneIcon} className="mt-1 shrink-0" size={18} strokeWidth={2} aria-hidden />
                  <span className="min-w-0 break-words">
                    {site.telefono} · {site.horario}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="mt-6 text-caption text-text-muted">{card.aviso}</p>
    </section>
  );
}
