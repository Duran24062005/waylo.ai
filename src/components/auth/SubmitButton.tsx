import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { focusRing } from "./styles";

export function SubmitButton({ className, children, ...props }: Omit<ComponentProps<"button">, "type">) {
  return (
    <button
      {...props}
      type="submit"
      className={cn(
        "inline-flex min-h-12 w-full items-center justify-center rounded-md bg-accent px-6",
        "text-body font-bold text-accent-foreground shadow-soft",
        "transition-[transform,opacity] duration-[var(--duration-fast)] ease-standard",
        "hover:opacity-90 active:scale-[0.99]",
        focusRing,
        className,
      )}
    >
      {children}
    </button>
  );
}
