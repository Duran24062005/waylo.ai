import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

export interface FieldErrorProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function FieldError({ id, children, className }: FieldErrorProps) {
  return (
    <p id={id} className={cn("flex items-start gap-2 text-sm font-semibold text-danger", className)}>
      <HugeiconsIcon icon={AlertCircleIcon} aria-hidden="true" className="mt-0.5 size-5 shrink-0" strokeWidth={2.25} />
      <span>{children}</span>
    </p>
  );
}
