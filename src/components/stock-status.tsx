import type { StockState } from "@/lib/products";

const dotColor: Record<StockState["status"], string> = {
  in_stock: "bg-success",
  low_stock: "bg-ink",
  out_of_stock: "bg-danger",
};

export function stockLabel(state: StockState) {
  switch (state.status) {
    case "in_stock":
      return "In stock";
    case "low_stock":
      return `Low stock: only ${state.quantity} left`;
    case "out_of_stock":
      return "Sold out";
  }
}

// Small dot plus label. Color is never the only signal: the text says it too.
export function StockStatus({
  state,
  label = stockLabel(state),
  className = "",
}: {
  state: StockState;
  label?: string;
  className?: string;
}) {
  return (
    <p className={`flex items-center gap-2 text-caption ${className}`}>
      <span
        className={`size-1.5 shrink-0 rounded-full ${dotColor[state.status]}`}
        aria-hidden
      />
      {label}
    </p>
  );
}
