import type { ReactNode } from "react";

export function AdminPageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3">
      <h2 className="type-editorial text-heading">{title}</h2>
      {description ? (
        <p className="max-w-prose text-body text-ink-muted">{description}</p>
      ) : null}
      {children}
    </header>
  );
}

// Stand-in body for sections whose tools are not built yet.
export function AdminComingSoon() {
  return (
    <p className="border-y border-line py-10 text-body text-ink-muted">
      This section is not built yet.
    </p>
  );
}
