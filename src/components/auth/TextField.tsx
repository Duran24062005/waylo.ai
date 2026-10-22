import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { useId, type ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { FieldError } from "./FieldError";
import { controlClasses } from "./styles";

export interface TextFieldProps extends Omit<ComponentProps<"input">, "id" | "className"> {
  label: string;
  error?: string;
  /** Rendered inside the input box on the right, e.g. the password toggle. */
  trailing?: (inputId: string) => React.ReactNode;
  /** Icon shown inside the box on the left. */
  leading?: IconSvgElement;
  /** Id for the input. Generated when omitted. */
  id?: string;
}

export function TextField({ label, error, trailing, leading, id, ref, ...inputProps }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="font-heading text-sm font-medium text-text">
        {label}
      </label>
      <div className="relative">
        {leading ? (
          <HugeiconsIcon
            icon={leading}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-text-muted"
            strokeWidth={2}
          />
        ) : null}
        <input
          {...inputProps}
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={controlClasses(Boolean(error), cn(trailing && "pr-14", leading && "pl-12"))}
        />
        {trailing?.(inputId)}
      </div>
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  );
}
