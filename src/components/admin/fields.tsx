import type { ComponentProps } from "react";

type Shared = { name: string; label: string; error?: string | null; hint?: string };

function describedBy(name: string, error?: string | null, hint?: string) {
  return error ? `${name}-error` : hint ? `${name}-hint` : undefined;
}

function Message({ name, error, hint }: Pick<Shared, "name" | "error" | "hint">) {
  if (error) {
    return (
      <p id={`${name}-error`} className="field-error">
        {error}
      </p>
    );
  }
  return hint ? (
    <p id={`${name}-hint`} className="field-hint">
      {hint}
    </p>
  ) : null;
}

// Same markup and classes as TextField, for the inputs it does not cover.

export function TextAreaField({
  name,
  label,
  error,
  hint,
  ...props
}: Shared & Omit<ComponentProps<"textarea">, "id" | "name" | "className">) {
  return (
    <div>
      <label htmlFor={name} className="field-label">
        {label}
      </label>
      <textarea
        {...props}
        id={name}
        name={name}
        className="textarea"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(name, error, hint)}
      />
      <Message name={name} error={error} hint={hint} />
    </div>
  );
}

export function SelectField({
  name,
  label,
  error,
  hint,
  children,
  ...props
}: Shared & Omit<ComponentProps<"select">, "id" | "name" | "className">) {
  return (
    <div>
      <label htmlFor={name} className="field-label">
        {label}
      </label>
      <select
        {...props}
        id={name}
        name={name}
        className="select"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(name, error, hint)}
      >
        {children}
      </select>
      <Message name={name} error={error} hint={hint} />
    </div>
  );
}
