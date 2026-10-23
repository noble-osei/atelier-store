import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins/admin";

import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  // Email + password only: no verification, reset or social providers yet.
  emailAndPassword: { enabled: true },
  session: {
    // Persistent sessions: 30 days, extended at most once a day while in use.
    // No cookieCache, so role changes and revocation apply on the next request.
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  // admin() adds user.role (default "user"). Promote with `pnpm db:make-admin`.
  // nextCookies must stay last so Server Actions can set cookies.
  plugins: [admin(), nextCookies()],
});
