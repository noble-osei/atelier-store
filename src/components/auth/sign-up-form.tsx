"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type ChangeEvent, type FocusEvent, type FormEvent, useState } from "react";

import { TextField } from "@/components/auth/text-field";
import { authClient } from "@/lib/auth-client";
import {
  MIN_PASSWORD_LENGTH,
  NETWORK_ERROR,
  mapAuthError,
  validateEmail,
  validateName,
  validateNewPassword,
} from "@/lib/auth-validation";
import { safeRedirectPath } from "@/lib/safe-redirect";

type Field = "name" | "email" | "password";
type FieldErrors = Partial<Record<Field, string>>;

const FIELDS: Field[] = ["name", "email", "password"];

const validators: Record<Field, (value: string) => string | null> = {
  name: validateName,
  email: validateEmail,
  password: validateNewPassword,
};

export function SignUpForm() {
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
    const values: Record<Field, string> = {
      name: String(data.get("name")).trim(),
      email: String(data.get("email")).trim(),
      password: String(data.get("password")),
    };

    const errors: FieldErrors = {};
    for (const field of FIELDS) {
      const message = validators[field](values[field]);
      if (message) errors[field] = message;
    }
    setFieldErrors(errors);
    setFormError(null);

    const firstInvalid = FIELDS.find((field) => errors[field]);
    if (firstInvalid) {
      form.querySelector<HTMLInputElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    setPending(true);
    try {
      // Signs the new customer in on success (autoSignIn is on by default).
      const { error } = await authClient.signUp.email(values);
      if (error) {
        const mapped = mapAuthError(error, "signUp");
        if (mapped.field) {
          setFieldError(mapped.field, mapped.message);
          form.querySelector<HTMLInputElement>(`[name="${mapped.field}"]`)?.focus();
        } else {
          setFormError(mapped.message);
        }
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

  const signInHref = nextParam ? `/sign-in?next=${encodeURIComponent(nextParam)}` : "/sign-in";

  return (
    <form onSubmit={onSubmit} noValidate aria-busy={pending} className="flex flex-col gap-5">
      <TextField
        name="name"
        label="Full name"
        autoComplete="name"
        required
        error={fieldErrors.name}
        onBlur={onBlur}
        onChange={onChange}
      />
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
        errorAction={
          fieldErrors.email?.includes("already exists") ? (
            <Link href={signInHref} className="link">
              Sign in instead
            </Link>
          ) : null
        }
        onBlur={onBlur}
        onChange={onChange}
      />
      <TextField
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        required
        hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
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
        {pending ? "Creating account…" : "Create account"}
      </button>

      <p className="text-caption text-ink-muted">
        Already have an account?{" "}
        <Link href={signInHref} className="link">
          Sign in
        </Link>
      </p>
    </form>
  );
}
