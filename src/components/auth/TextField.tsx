import { useId, type ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { FieldError } from "./FieldError";
import { controlClasses } from "./styles";

export interface TextFieldProps extends Omit<ComponentProps<"input">, "id" | "className"> {
  label: string;
  error?: string;
  /** Rendered inside the input box on the right, e.g. the password toggle. */
  trailing?: (inputId: string) => React.ReactNode;
  /** Id for the input. Generated when omitted. */
  id?: string;
}

export function TextField({ label, error, trailing, id, ref, ...inputProps }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-body font-bold text-text">
        {label}
      </label>
      <div className="relative">
        <input
          {...inputProps}
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={controlClasses(Boolean(error), cn(trailing && "pr-14"))}
        />
        {trailing?.(inputId)}
      </div>
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  );
}
