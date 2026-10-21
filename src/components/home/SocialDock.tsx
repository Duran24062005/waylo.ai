"use client";

import { useState } from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { GlobeIcon, Link01Icon, Mail01Icon, MessageCircleIcon, PhoneIcon } from "@hugeicons/core-free-icons";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { duration, easing } from "@/design/motion";
import { socialLinks, type SocialIconName } from "@/data/social-links";

const ease = [...easing.standard] as [number, number, number, number];

const icons: Record<SocialIconName, IconSvgElement> = {
  globe: GlobeIcon,
  mail: Mail01Icon,
  link: Link01Icon,
  message: MessageCircleIcon,
  phone: PhoneIcon,
};

function displayHref(href: string): string {
  try {
    const url = new URL(href);
    return url.protocol === "http:" || url.protocol === "https:" ? url.host : href;
  } catch {
    return href;
  }
}

export function SocialDock() {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  if (socialLinks.length === 0) return null;

  const active = socialLinks.find((link) => link.id === activeId) ?? null;
  const ActiveIcon = active ? icons[active.icon] : null;

  const show = (id: string) => {
    setActiveId(id);
    setOpen(true);
  };
  // activeId stays set so the preview content fades out instead of vanishing.
  const hide = () => setOpen(false);

  return (
    <MotionConfig reducedMotion="user">
      <nav aria-label="Enlaces" className="relative flex flex-col items-center">
        {/* Decorative copy of the hovered link; the links themselves carry the accessible names. */}
        <motion.div
          aria-hidden="true"
          initial={false}
          animate={{ opacity: open ? 1 : 0, y: open ? 0 : 6 }}
          transition={{ duration: duration.base, ease }}
          className="pointer-events-none absolute bottom-full mb-3 h-20 w-64 rounded-md border border-border bg-surface-raised shadow-raised"
        >
          <AnimatePresence>
            {active && ActiveIcon ? (
              <motion.div
                key={active.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: duration.base, ease }}
                className="absolute inset-0 flex items-center gap-3 px-4"
              >
                <HugeiconsIcon icon={ActiveIcon} aria-hidden="true" className="size-6 shrink-0 text-accent" strokeWidth={2} />
                <span className="min-w-0 text-left">
                  <span className="block truncate text-body font-bold text-text">{active.label}</span>
                  <span className="block truncate text-caption text-text-muted">
                    {displayHref(active.href)}
                  </span>
                </span>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>

        <ul className="flex items-center gap-2 rounded-full border border-border bg-surface-raised p-2 shadow-soft">
          {socialLinks.map((link) => {
            const icon = icons[link.icon];
            return (
              <li key={link.id}>
                <motion.a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${link.label} (se abre en otra pestaña)`}
                  onHoverStart={() => show(link.id)}
                  onHoverEnd={hide}
                  onFocus={() => show(link.id)}
                  onBlur={hide}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ duration: duration.fast, ease }}
                  className="flex size-11 items-center justify-center rounded-full text-text hover:bg-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                >
                  <HugeiconsIcon icon={icon} aria-hidden="true" className="size-6" strokeWidth={2} />
                </motion.a>
              </li>
            );
          })}
        </ul>
      </nav>
    </MotionConfig>
  );
}
