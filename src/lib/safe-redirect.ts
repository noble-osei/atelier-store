const DEFAULT_PATH = "/account";

// Only same-site paths are allowed as a post-sign-in destination, so a crafted
// `?next=` cannot send people to another site ("//evil.com", "https://...",
// "/\evil.com").
export function safeRedirectPath(next: string | null | undefined) {
  if (!next || !next.startsWith("/")) return DEFAULT_PATH;
  if (next.startsWith("//") || next.includes("\\")) return DEFAULT_PATH;
  return next;
}
