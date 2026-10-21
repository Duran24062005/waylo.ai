import type { ComponentProps } from "react";
import { buttonPrimary } from "@/components/ui/buttons";
import { cn } from "@/lib/utils";

export function SubmitButton({
  className,
  children,
  loading,
  ...props
}: Omit<ComponentProps<"button">, "type"> & { loading?: boolean }) {
  return (
    <button
      {...props}
      type="submit"
      disabled={loading || props.disabled}
      aria-busy={loading || undefined}
      className={cn(buttonPrimary, "w-full", className)}
    >
      {loading ? "Un momento…" : children}
    </button>
  );
}
