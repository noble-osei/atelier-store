// Loads the initial catalog: `pnpm db:seed`.
// Wipes categories, products and stock first, so only run it on a fresh or
// development database.
import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";
import { seedProducts } from "./seed-data";

loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not set");

// Own client: ./index.ts imports "server-only", which throws outside Next.
const db = drizzle({ client: neon(databaseUrl), schema });
const { categories, products, productStock } = schema;

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function seed() {
  await db.execute(
    sql`truncate table ${productStock}, ${products}, ${categories} restart identity cascade`,
  );

  const categoryNames = [...new Set(seedProducts.map((p) => p.category))];
  const insertedCategories = await db
    .insert(categories)
    .values(categoryNames.map((name) => ({ name, slug: slugify(name) })))
    .returning({ id: categories.id, name: categories.name });
  const categoryId = new Map(insertedCategories.map((c) => [c.name, c.id]));

  const insertedProducts = await db
    .insert(products)
    .values(
      seedProducts.map((p) => ({
        categoryId: categoryId.get(p.category)!,
        slug: p.slug,
        reference: p.reference,
        name: p.name,
        priceCents: Math.round(p.price * 100),
        badge: p.badge ?? null,
        description: p.description,
        details: p.details,
        colors: p.colors,
        images: p.images,
      })),
    )
    .returning({ id: products.id, slug: products.slug });
  const productId = new Map(insertedProducts.map((p) => [p.slug, p.id]));

  const stockRows = seedProducts.flatMap((p) =>
    p.sizes.map((size, position) => ({
      productId: productId.get(p.slug)!,
      size: size.label,
      quantity: size.stock,
      position,
    })),
  );
  await db.insert(productStock).values(stockRows);

  console.log(
    `Seeded ${insertedCategories.length} categories, ${insertedProducts.length} products, ${stockRows.length} stock rows.`,
  );
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
