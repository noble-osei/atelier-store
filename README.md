# Atelier Store

Next.js 16 (App Router, `src/` dir, Cache Components) · TypeScript · Tailwind CSS v4 · Better Auth · Drizzle ORM · Neon Postgres.

## Setup

```bash
pnpm install
cp .env.example .env.local   # fill in DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL
pnpm dev
```

`DATABASE_URL` is required for `dev` and `build`.

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` / `build` / `start` | Next.js |
| `pnpm lint` / `typecheck` | ESLint / TypeScript |
| `pnpm db:generate` | Create SQL migrations in `drizzle/` from `src/db/schema.ts` |
| `pnpm db:migrate` | Apply migrations to Neon |
| `pnpm db:push` | Push the schema straight to the database (prototyping) |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm auth:generate` | Generate Better Auth tables into `src/db/auth-schema.ts` |

## Layout

```
src/
  app/
    api/auth/[...all]/route.ts   Better Auth handler
    layout.tsx, page.tsx
  db/
    index.ts                     Drizzle client (Neon HTTP driver)
    schema.ts                    Table exports
  lib/
    auth.ts                      Better Auth server instance
    auth-client.ts               Better Auth React client
drizzle.config.ts                Drizzle Kit config
drizzle/                         Generated migrations
```

## Adding auth tables

1. `pnpm auth:generate`
2. Uncomment `export * from "./auth-schema";` in `src/db/schema.ts`
3. `pnpm db:generate && pnpm db:migrate`
