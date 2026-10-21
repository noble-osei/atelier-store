import Link from "next/link";
import type { Category } from "@/lib/products";

/* Switch between categories; scrolls sideways on narrow screens */
export function CategoryNav({
  categories,
  current,
  label = "Categories",
}: {
  categories: Category[];
  current?: string;
  label?: string;
}) {
  return (
    <nav aria-label={label} className="mb-6 max-md:full-bleed">
      <ul className="scrollbar-none flex gap-6 overflow-x-auto max-md:px-gutter md:flex-wrap md:justify-center">
        {categories.map((category) => (
          <li key={category.slug} className="shrink-0">
            <Link
              href={`/categories/${category.slug}`}
              aria-current={category.slug === current ? "page" : undefined}
              className="nav-link"
            >
              {category.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
