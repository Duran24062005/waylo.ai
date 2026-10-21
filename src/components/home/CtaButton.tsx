"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { buttonPrimary, buttonSoft } from "@/components/ui/buttons";
import { cn } from "@/lib/utils";
import { duration, easing } from "@/design/motion";

const MotionLink = motion.create(Link);

const ease = [...easing.standard] as [number, number, number, number];

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
    <MotionLink
      href={href}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: duration.fast, ease }}
      className={cn("min-h-14 gap-3 px-8 text-body-lg", variants[variant], className)}
    >
      <span>{children}</span>
      {icon}
    </MotionLink>
  );
}
