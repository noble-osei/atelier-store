// Catalog tables: categories, products and per-size stock.
import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import type { Image } from "../lib/images";

export type ProductColor = { name: string; value: string };

export const productBadge = pgEnum("product_badge", [
  "New",
  "Limited",
  "Exclusive",
]);

export const categories = pgTable("categories", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const products = pgTable(
  "products",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    slug: text("slug").notNull().unique(),
    /** Shown as "Ref." and used as the SKU in structured data. */
    reference: text("reference").notNull().unique(),
    name: text("name").notNull(),
    /** Whole cents, so $3,200 is 320000. */
    priceCents: integer("price_cents").notNull(),
    badge: productBadge("badge"),
    description: text("description").notNull(),
    details: jsonb("details").$type<string[]>().notNull().default([]),
    colors: jsonb("colors").$type<ProductColor[]>().notNull().default([]),
    /** First image is the primary shot used in grids. */
    images: jsonb("images").$type<Image[]>().notNull(),
    /** Set while the product is hidden from the storefront. Rows are never deleted. */
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("products_category_id_idx").on(table.categoryId),
    check("products_price_positive", sql`${table.priceCents} > 0`),
  ],
);

// One row per product and size. One-size products have a single
// "One size" row. This is stock only, not a variant: no SKU or price.
export const productStock = pgTable(
  "product_stock",
  {
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    size: text("size").notNull(),
    quantity: integer("quantity").notNull().default(0),
    /** Display order of the size (XS before S, 36 before 37). */
    position: integer("position").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.size] }),
    check("product_stock_quantity_non_negative", sql`${table.quantity} >= 0`),
  ],
);

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  stock: many(productStock),
}));

export const productStockRelations = relations(productStock, ({ one }) => ({
  product: one(products, {
    fields: [productStock.productId],
    references: [products.id],
  }),
}));
