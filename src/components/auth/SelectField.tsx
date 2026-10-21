import { HugeiconsIcon } from "@hugeicons/react";
import { ChevronDownIcon } from "@hugeicons/core-free-icons";
import { useId, type ComponentProps } from "react";
import { controlClasses } from "./styles";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps extends Omit<ComponentProps<"select">, "id" | "className" | "children"> {
  label: string;
  /** Text of the empty first option. */
  placeholder: string;
  options: readonly SelectOption[];
  /** Id of an element that describes this select, usually a shared error message. */
  describedBy?: string;
  invalid?: boolean;
}

export function SelectField({
  label,
  placeholder,
  options,
  describedBy,
  invalid,
  ref,
  ...selectProps
}: SelectFieldProps) {
  const id = useId();

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={id} className="font-heading text-base font-medium text-text">
        {label}
      </label>
      <div className="relative">
        <select
          {...selectProps}
          ref={ref}
          id={id}
          aria-invalid={invalid ? true : undefined}
          aria-describedby={describedBy}
          className={controlClasses(Boolean(invalid), "appearance-none pr-11")}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <HugeiconsIcon
          icon={ChevronDownIcon}
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-text-muted"
          strokeWidth={2.25}
        />
      </div>
    </div>
  );
}
