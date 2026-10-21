import type { ReactNode } from "react";
import Link from "next/link";
import { buttonPrimary, buttonSoft } from "@/components/ui/buttons";
import { cn } from "@/lib/utils";

const variants = {
  primary: buttonPrimary,
  secondary: buttonSoft,
} as const;

export interface CtaButtonProps {
  href: string;
  variant?: keyof typeof variants;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function CtaButton({ href, variant = "primary", icon, children, className }: CtaButtonProps) {
  return (
    <Link href={href} className={cn("group min-h-14 gap-3 px-8 text-body-lg", variants[variant], className)}>
      <span>{children}</span>
      {icon ? (
        <span aria-hidden className="inline-flex transition-transform duration-[var(--duration-base)] ease-standard group-hover:translate-x-1">
          {icon}
        </span>
      ) : null}
    </Link>
  );
}
