"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { duration, easing } from "@/design/motion";

const MotionLink = motion.create(Link);

const ease = [...easing.standard] as [number, number, number, number];

const variants = {
  primary: "bg-accent text-accent-foreground shadow-soft hover:shadow-raised",
  secondary: "border border-border-strong bg-surface-raised text-text hover:bg-surface",
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
    <MotionLink
      href={href}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98, y: 0 }}
      transition={{ duration: duration.fast, ease }}
      className={cn(
        "inline-flex min-h-14 items-center justify-center gap-3 rounded-lg px-8 text-body-lg font-bold",
        "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
        variants[variant],
        className,
      )}
    >
      <span>{children}</span>
      {icon}
    </MotionLink>
  );
}
