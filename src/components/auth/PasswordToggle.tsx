import { HugeiconsIcon } from "@hugeicons/react";
import { EyeIcon, EyeOffIcon } from "@hugeicons/core-free-icons";
import { useT } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { focusRing } from "./styles";

export interface PasswordToggleProps {
  visible: boolean;
  onToggle: () => void;
  /** Id of the password input, so assistive tech knows what the button controls. */
  controls: string;
}

export function PasswordToggle({ visible, onToggle, controls }: PasswordToggleProps) {
  const t = useT();
  const icon = visible ? EyeOffIcon : EyeIcon;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-controls={controls}
      aria-label={visible ? t.auth.hidePassword : t.auth.showPassword}
      className={cn(
        "absolute inset-y-0 right-0 inline-flex min-h-11 min-w-11 items-center justify-center rounded-md",
        "lift lift-sm text-text-muted hover:text-text",
        focusRing,
      )}
    >
      <HugeiconsIcon icon={icon} aria-hidden="true" className="size-6" strokeWidth={2} />
    </button>
  );
}
