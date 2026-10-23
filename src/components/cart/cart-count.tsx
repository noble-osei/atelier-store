import { countUnits } from "@/lib/cart";
import { readCart } from "@/lib/cart-cookie";

// Units in the bag, read from the cart cookie only (no database call per page).
// It reads cookies, so render it inside <Suspense>.
export async function CartCount() {
  const count = countUnits(await readCart());
  if (count === 0) return <span className="sr-only">, empty</span>;

  return (
    <>
      <span
        className="absolute top-2 right-1.5 grid size-4 place-items-center rounded-full bg-ink text-[0.5625rem] leading-none text-canvas"
        aria-hidden
      >
        {count > 9 ? "9+" : count}
      </span>
      <span className="sr-only">
        , {count} {count === 1 ? "item" : "items"}
      </span>
    </>
  );
}
