export function EpsField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="mb-4 block text-body font-bold text-text">
      EPS (opcional)
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Ej. Nueva EPS"
        className="mt-1 block min-h-12 w-full min-w-0 rounded-md border-2 border-border-strong bg-surface-raised px-3 text-body font-normal text-text placeholder:text-text-muted focus-visible:border-accent focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      />
    </label>
  );
}
