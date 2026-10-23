// Order tables: what a customer bought, what it cost, and where Stripe stands.
import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth-schema";
import { products } from "./catalog-schema";

/** Address snapshot copied from Stripe once the customer has paid. */
export type ShippingAddress = {
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  /** ISO 3166-1 alpha-2, e.g. "US". */
  country: string;
};

// Payment lifecycle only. Fulfilment (packed, shipped) is not modelled yet.
//   pending: stock is held and a Stripe Checkout Session is (or is about to be) open
//   paid:    Stripe confirmed the money was collected
//   failed:  a delayed payment method failed; stock was released
//   expired: the session expired or was abandoned; stock was released
export const paymentStatus = pgEnum("payment_status", [
  "pending",
  "paid",
  "failed",
  "expired",
]);

export const orders = pgTable(
  "orders",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    /** Generated in the app. Goes into Stripe metadata and customer-facing URLs. */
    publicId: uuid("public_id").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    paymentStatus: paymentStatus("payment_status").notNull().default("pending"),
    currency: text("currency").notNull().default("usd"),
    /** Whole cents, like products.price_cents. */
    subtotalCents: integer("subtotal_cents").notNull(),
    shippingCents: integer("shipping_cents").notNull(),
    totalCents: integer("total_cents").notNull(),
    /** Null only between reserving stock and creating the Checkout Session. */
    stripeCheckoutSessionId: text("stripe_checkout_session_id").unique(),
    stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
    /** When the held stock goes back on sale. Matches the session's expires_at. */
    reservedUntil: timestamp("reserved_until", { withTimezone: true }).notNull(),
    /** Set once when held stock is returned, so a release can never run twice. */
    stockReleasedAt: timestamp("stock_released_at", { withTimezone: true }),
    /** Why a person must look at this order (amount mismatch, paid after expiry). */
    needsReviewReason: text("needs_review_reason"),
    /** Copied from Stripe after payment. */
    email: text("email"),
    shippingName: text("shipping_name"),
    shippingAddress: jsonb("shipping_address").$type<ShippingAddress>(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("orders_user_id_idx").on(table.userId),
    index("orders_pending_reserved_until_idx")
      .on(table.reservedUntil)
      .where(sql`${table.paymentStatus} = 'pending'`),
    // One open checkout per customer, so repeated clicks cannot hold all the stock.
    uniqueIndex("orders_one_pending_per_user_idx")
      .on(table.userId)
      .where(sql`${table.paymentStatus} = 'pending'`),
    check("orders_currency_usd", sql`${table.currency} = 'usd'`),
    check("orders_subtotal_positive", sql`${table.subtotalCents} > 0`),
    check("orders_shipping_non_negative", sql`${table.shippingCents} >= 0`),
    check(
      "orders_total_is_subtotal_plus_shipping",
      sql`${table.totalCents} = ${table.subtotalCents} + ${table.shippingCents}`,
    ),
    check(
      "orders_paid_has_paid_at",
      sql`(${table.paymentStatus} = 'paid') = (${table.paidAt} is not null)`,
    ),
  ],
);

// What was sold, as it was when the order was placed: the name and price are
// copied so later catalog edits never change an existing order.
export const orderItems = pgTable(
  "order_items",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    productSlug: text("product_slug").notNull(),
    reference: text("reference").notNull(),
    name: text("name").notNull(),
    size: text("size").notNull(),
    color: text("color"),
    unitPriceCents: integer("unit_price_cents").notNull(),
    quantity: integer("quantity").notNull(),
  },
  (table) => [
    index("order_items_order_id_idx").on(table.orderId),
    index("order_items_product_id_idx").on(table.productId),
    check("order_items_unit_price_positive", sql`${table.unitPriceCents} > 0`),
    check("order_items_quantity_positive", sql`${table.quantity} > 0`),
  ],
);

// Log of Stripe webhook events already received, so a redelivered event is
// recognised. Handlers are still idempotent on their own.
export const stripeEvents = pgTable("stripe_events", {
  /** Stripe's event id, "evt_...". */
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  orderId: integer("order_id").references(() => orders.id, { onDelete: "set null" }),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  /** Null while unfinished: Stripe will retry, and the handler runs again. */
  processedAt: timestamp("processed_at", { withTimezone: true }),
});

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(user, { fields: [orders.userId], references: [user.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));
