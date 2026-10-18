import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section container-prose flex flex-col items-center gap-6 text-center">
      <p className="type-eyebrow">Page not found</p>
      <h1 className="type-editorial text-display">
        This piece is no longer here
      </h1>
      <p className="text-body text-ink-muted">
        The page you are looking for may have moved, or the product is no
        longer available.
      </p>
      <Link href="/" className="btn btn-primary">
        Return to the store
      </Link>
    </section>
  );
}
