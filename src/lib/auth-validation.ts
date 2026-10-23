// Client-side checks for the sign-in and sign-up forms. They only give fast
// feedback; Better Auth still validates on the server.

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateName(value: string) {
  if (!value.trim()) return "Enter your full name.";
  return null;
}

export function validateEmail(value: string) {
  const email = value.trim();
  if (!email) return "Enter your email address.";
  if (!EMAIL_PATTERN.test(email)) return "Enter a valid email address, like name@example.com.";
  return null;
}

export function validateNewPassword(value: string) {
  if (!value) return "Create a password.";
  if (value.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (value.length > MAX_PASSWORD_LENGTH) {
    return `Use ${MAX_PASSWORD_LENGTH} characters or fewer.`;
  }
  return null;
}

// Sign-in only checks presence: the stored password may predate any new rule.
export function validateCurrentPassword(value: string) {
  if (!value) return "Enter your password.";
  return null;
}

export type AuthFailure = { code?: string; message?: string; status: number };

export type MappedAuthError = {
  field?: "email" | "password";
  message: string;
};

const FALLBACK = {
  signIn: "We could not sign you in. Please try again.",
  signUp: "We could not create your account. Please try again.",
} as const;

// Turns a Better Auth failure into copy for customers, attached to a field
// when it clearly belongs to one. Unknown failures never leak server text.
export function mapAuthError(error: AuthFailure, flow: keyof typeof FALLBACK): MappedAuthError {
  if (error.status === 429) {
    return { message: "Too many attempts. Wait a moment and try again." };
  }
  if (error.status >= 500) {
    return { message: "Something went wrong on our side. Please try again shortly." };
  }

  switch (error.code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return { message: "That email and password do not match. Check them and try again." };
    case "INVALID_EMAIL":
      return { field: "email", message: "Enter a valid email address." };
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return { field: "email", message: "An account with this email already exists." };
    case "PASSWORD_TOO_SHORT":
      return { field: "password", message: `Use at least ${MIN_PASSWORD_LENGTH} characters.` };
    case "PASSWORD_TOO_LONG":
      return { field: "password", message: `Use ${MAX_PASSWORD_LENGTH} characters or fewer.` };
    default:
      return { message: FALLBACK[flow] };
  }
}

export const NETWORK_ERROR = "We could not reach the store. Check your connection and try again.";
