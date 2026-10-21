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
        "rounded-lg border-2 bg-surface-raised p-4 shadow-raised",
        urgent ? "border-danger" : "border-border-strong",
      )}
      aria-label="Orientación"
    >
      <p className="text-caption font-bold uppercase tracking-wide text-text-muted">
        Nivel de atención recomendado
      </p>
      <p
        className={cn(
          "mt-2 inline-flex rounded-full px-4 py-2 text-body-lg font-bold",
          BADGE[card.nivel],
          urgent && "ring-2 ring-danger ring-offset-2 ring-offset-surface-raised",
        )}
      >
        {card.nivelLabel}
      </p>

      <h2 className="mt-4 text-body font-bold text-text">Por qué</h2>
      <p className="mt-1 text-body text-text">{card.justificacion}</p>

      <h2 className="mt-4 text-body font-bold text-text">Qué debes llevar</h2>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-body text-text marker:text-text-muted">
        {card.queLlevar.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      {card.sedes.length > 0 && (
        <>
          <h2 className="mt-4 text-body font-bold text-text">Lugares de ejemplo</h2>
          <ul className="mt-2 space-y-3">
            {card.sedes.map((site) => (
              <li key={site.id} className="rounded-md border border-border bg-surface p-3">
                <p className="text-body font-bold text-text">{site.nombre}</p>
                <p className="mt-1 flex items-start gap-2 text-caption text-text">
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

      <p className="mt-4 text-caption text-text-muted">{card.aviso}</p>
    </section>
  );
}
