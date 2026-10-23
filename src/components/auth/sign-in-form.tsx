"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type ChangeEvent, type FocusEvent, type FormEvent, useState } from "react";

import { TextField } from "@/components/auth/text-field";
import { authClient } from "@/lib/auth-client";
import {
  NETWORK_ERROR,
  mapAuthError,
  validateCurrentPassword,
  validateEmail,
} from "@/lib/auth-validation";
import { safeRedirectPath } from "@/lib/safe-redirect";

type Field = "email" | "password";
type FieldErrors = Partial<Record<Field, string>>;

const validators: Record<Field, (value: string) => string | null> = {
  email: validateEmail,
  password: validateCurrentPassword,
};

export function SignInForm() {
  const router = useRouter();
  const nextParam = useSearchParams().get("next");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function setFieldError(field: Field, message: string | null) {
    setFieldErrors((current) => {
      if ((current[field] ?? null) === message) return current;
      const next = { ...current };
      if (message) next[field] = message;
      else delete next[field];
      return next;
    });
  }

  // Check a field when the customer leaves it, and keep an existing error
  // current while they fix it, so it clears the moment the value is valid.
  function onBlur(event: FocusEvent<HTMLInputElement>) {
    const field = event.currentTarget.name as Field;
    setFieldError(field, validators[field](event.currentTarget.value));
  }
  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.currentTarget.name as Field;
    if (fieldErrors[field]) setFieldError(field, validators[field](event.currentTarget.value));
    if (formError) setFormError(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email")).trim();
    const password = String(data.get("password"));

    const errors: FieldErrors = {};
    const emailError = validateEmail(email);
    const passwordError = validateCurrentPassword(password);
    if (emailError) errors.email = emailError;
    if (passwordError) errors.password = passwordError;
    setFieldErrors(errors);
    setFormError(null);

    const firstInvalid = errors.email ? "email" : errors.password ? "password" : null;
    if (firstInvalid) {
      form.querySelector<HTMLInputElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    setPending(true);
    try {
      // Sessions are persistent by default (rememberMe is on).
      const { error } = await authClient.signIn.email({ email, password });
      if (error) {
        const mapped = mapAuthError(error, "signIn");
        if (mapped.field) setFieldError(mapped.field, mapped.message);
        else setFormError(mapped.message);
        setPending(false);
        return;
      }
    } catch {
      setFormError(NETWORK_ERROR);
      setPending(false);
      return;
    }
    // Stay in the pending state while the next page loads.
    router.replace(safeRedirectPath(nextParam));
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate aria-busy={pending} className="flex flex-col gap-5">
      <TextField
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        inputMode="email"
        autoCapitalize="none"
        spellCheck={false}
        required
        error={fieldErrors.email}
        onBlur={onBlur}
        onChange={onChange}
      />
      <TextField
        name="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        required
        error={fieldErrors.password}
        onBlur={onBlur}
        onChange={onChange}
      />

      {formError ? (
        <p role="alert" className="field-error">
          {formError}
        </p>
      ) : null}

      <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>

      <p className="text-caption text-ink-muted">
        New to Atelier?{" "}
        <Link
          href={nextParam ? `/sign-up?next=${encodeURIComponent(nextParam)}` : "/sign-up"}
          className="link"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
