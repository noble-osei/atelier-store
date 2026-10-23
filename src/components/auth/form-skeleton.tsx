/* Mirrors the real form so content does not jump when it streams in */
export function FormSkeleton({ fields }: { fields: number }) {
  return (
    <div className="flex flex-col gap-5" aria-busy="true">
      <span className="sr-only">Loading form</span>
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="h-4.5 w-20 bg-surface" />
          <div className="h-control w-full bg-surface" />
        </div>
      ))}
      <div className="h-control w-full bg-surface" />
    </div>
  );
}
