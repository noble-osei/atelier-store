"use client";

import { type ComponentProps, type ReactNode, useState } from "react";

import { EyeIcon, EyeOffIcon } from "@/components/icons";

type TextFieldProps = Omit<ComponentProps<"input">, "id" | "name" | "className"> & {
  name: string;
  label: string;
  error?: string | null;
  // Shown under the input while there is no error
  hint?: string;
  // Extra content after the error, e.g. a link to sign in
  errorAction?: ReactNode;
};

export function TextField({
  name,
  label,
  type = "text",
  error,
  hint,
  errorAction,
  ...inputProps
}: TextFieldProps) {
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === "password";
  const describedBy = error ? `${name}-error` : hint ? `${name}-hint` : undefined;

  return (
    <div>
      <label htmlFor={name} className="field-label">
        {label}
      </label>
      <div className="relative">
        <input
          {...inputProps}
          id={name}
          name={name}
          type={isPassword && revealed ? "text" : type}
          className={isPassword ? "input pr-12" : "input"}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setRevealed((value) => !value)}
            aria-label={revealed ? "Hide password" : "Show password"}
            aria-pressed={revealed}
            className="absolute inset-y-0 right-0 inline-flex w-12 items-center justify-center text-ink-muted hover:text-ink"
          >
            {revealed ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        ) : null}
      </div>
      {error ? (
        <p id={`${name}-error`} className="field-error">
          {error} {errorAction}
        </p>
      ) : hint ? (
        <p id={`${name}-hint`} className="field-hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
