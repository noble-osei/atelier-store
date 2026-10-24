// Postgres error details, whichever layer wrapped the driver error.
export function pgError(error: unknown): { code?: string; constraint?: string } {
  // Drizzle wraps driver errors, keeping the original in `cause`.
  let current: unknown = error;
  for (let depth = 0; depth < 3 && typeof current === "object" && current; depth++) {
    const { code, constraint, cause } = current as Record<string, unknown>;
    if (typeof code === "string") {
      return {
        code,
        constraint: typeof constraint === "string" ? constraint : undefined,
      };
    }
    current = cause;
  }
  return {};
}
