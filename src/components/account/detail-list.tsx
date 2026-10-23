/* Label / value pairs separated by hairlines */
export function DetailList({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="flex flex-col border-y border-line">
      {items.map(({ label, value }) => (
        <div
          key={label}
          className="flex flex-col gap-1 border-b border-line py-5 last:border-b-0 sm:flex-row sm:items-baseline sm:gap-6"
        >
          <dt className="type-label sm:w-40 sm:shrink-0">{label}</dt>
          <dd className="min-w-0 text-body break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function DetailListSkeleton({ rows }: { rows: number }) {
  return (
    <div className="flex flex-col border-y border-line" aria-busy="true">
      <span className="sr-only">Loading account details</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="border-b border-line py-5 last:border-b-0">
          <div className="h-4.5 w-1/2 bg-surface" />
        </div>
      ))}
    </div>
  );
}
