import "server-only";

import { cookies } from "next/headers";

import {
  CART_COOKIE,
  CART_MAX_AGE,
  parseCart,
  serializeCart,
  type CartLine,
} from "./cart";

// The cart cookie only records what the customer chose. It reads cookies(), so
// callers sit behind <Suspense> (or in a Server Action) and never in "use cache".

export async function readCart(): Promise<CartLine[]> {
  return parseCart((await cookies()).get(CART_COOKIE)?.value);
}

// Server Actions only: Server Components cannot set cookies.
export async function writeCart(lines: CartLine[]) {
  const store = await cookies();
  if (lines.length === 0) {
    store.delete(CART_COOKIE);
    return;
  }
  store.set(CART_COOKIE, serializeCart(lines), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CART_MAX_AGE,
  });
}
