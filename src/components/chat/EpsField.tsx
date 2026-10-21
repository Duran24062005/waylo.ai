export function EpsField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="block font-heading text-base font-medium text-text">
      Tu EPS (opcional)
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Ej. Nueva EPS"
        autoComplete="off"
        className="mt-2 block min-h-12 w-full min-w-0 rounded-md bg-surface px-4 font-sans text-body font-normal text-text shadow-inset transition-shadow duration-[var(--duration-fast)] ease-standard placeholder:text-text-muted focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      />
    </label>
  );
}
