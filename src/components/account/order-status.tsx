import { orderStage, type OrderView, type Stage } from "../checkout/order-confirmation";

// Payment status as the customer sees it. Uses the same stages as the
// confirmation page, so a paid-after-expiry order reads "Refunded", not "Expired".

const STATUS: Record<Stage, { label: string; className: string }> = {
  paid: { label: "Paid", className: "text-success" },
  pending: { label: "Awaiting payment", className: "text-ink" },
  reviewing: { label: "Under review", className: "text-danger" },
  refunded: { label: "Refunded", className: "text-ink" },
  refund_due: { label: "Refund due", className: "text-danger" },
  expired: { label: "Expired", className: "text-ink-muted" },
  failed: { label: "Failed", className: "text-danger" },
};

export function OrderStatusBadge({
  order,
}: {
  order: Pick<OrderView, "paymentStatus" | "needsReviewReason">;
}) {
  const { label, className } = STATUS[orderStage(order)];
  return <span className={`badge ${className}`}>{label}</span>;
}

const orderDate = new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeZone: "UTC" });

export function formatOrderDate(date: Date) {
  return orderDate.format(date);
}

/** The short reference shown to customers, the same one the confirmation page uses. */
export function orderNumber(publicId: string) {
  return publicId.slice(0, 8).toUpperCase();
}
