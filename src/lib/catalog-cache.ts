import "server-only";

import { revalidateTag } from "next/cache";

/**
 * Products or stock changed, so cached storefront pages must stop showing the
 * old data. Call from a Server Action or Route Handler, never during render.
 */
export function revalidateProducts() {
  revalidateTag("products", { expire: 0 });
}
