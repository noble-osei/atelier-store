const columns = [
  {
    title: "Client services",
    links: ["Contact us", "Shipping", "Returns and exchanges", "FAQ"],
  },
  {
    title: "The house",
    links: ["Our story", "Craftsmanship", "Sustainability", "Careers"],
  },
  {
    title: "Stores",
    links: ["Store locator", "Book an appointment", "Gift cards"],
  },
];

export function SiteFooter() {
  return (
    <footer className="theme-inverse bg-canvas">
      <div className="section container-site grid-editorial gap-y-14">
        <div className="col-span-4 md:col-span-12 lg:col-span-5">
          <p className="type-label mb-3">Newsletter</p>
          <p className="mb-6 max-w-sm text-body-sm text-ink-muted">
            Be first to hear about new collections, private sales and stories
            from the atelier.
          </p>
          <form className="flex flex-col gap-3 sm:flex-row">
            <label htmlFor="footer-email" className="sr-only">
              Email address
            </label>
            <input
              id="footer-email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="Email address"
              className="input"
            />
            <button type="submit" className="btn btn-primary">
              Subscribe
            </button>
          </form>
        </div>

        {columns.map((column, i) => (
          <div
            key={column.title}
            className={`col-span-2 md:col-span-4 lg:col-span-2 ${i === 0 ? "lg:col-start-7" : ""} ${i === 2 ? "max-md:col-span-4" : ""}`}
          >
            <p className="type-label mb-4">{column.title}</p>
            <ul className="flex flex-col gap-2.5 text-body-sm text-ink-muted">
              {column.links.map((link) => (
                <li key={link}>
                  <a href="#" className="link-quiet hover:text-ink">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="container-site flex flex-col items-center gap-6 py-10 md:flex-row md:justify-between">
          <span className="type-editorial text-heading tracking-[0.28em] uppercase">
            Atelier
          </span>
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-caption text-ink-muted">
            <li>© Atelier 2026</li>
            <li>
              <a href="#" className="link-quiet">
                Privacy
              </a>
            </li>
            <li>
              <a href="#" className="link-quiet">
                Terms
              </a>
            </li>
            <li>
              <a href="#" className="link-quiet">
                Accessibility
              </a>
            </li>
            <li>
              <a href="#" className="link-quiet">
                United States (USD)
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
