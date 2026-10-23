// Promotes an existing user to admin: `pnpm db:make-admin you@example.com`.
// The person must sign up through the store first. Sessions are read from the
// database on every request, so the role applies on their next page load.
import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not set");

const email = process.argv[2]?.trim().toLowerCase();
if (!email) throw new Error("Usage: pnpm db:make-admin <email>");

// Own client: ./index.ts imports "server-only", which throws outside Next.
const db = drizzle({ client: neon(databaseUrl), schema });

async function makeAdmin() {
  const updated = await db
    .update(schema.user)
    .set({ role: "admin" })
    .where(eq(schema.user.email, email))
    .returning({ id: schema.user.id, email: schema.user.email });

  if (updated.length === 0) {
    throw new Error(`No user with email ${email}. Sign up first.`);
  }
  console.log(`${updated[0].email} is now an admin.`);
}

makeAdmin().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
