# Atelier Store

A storefront with customer accounts, a cookie-based cart, Stripe hosted Checkout and an admin area for managing products, stock and orders.

Built with Next.js 16 (App Router, Cache Components), TypeScript, Tailwind CSS v4, Better Auth, Drizzle ORM and Neon Postgres.

## Features

- **Catalog**: products and categories in Postgres, with search, category pages and a new arrivals page.
- **Accounts**: email and password sign-up, order history and account details.
- **Cart and checkout**: the cart is a cookie. Prices, stock and shipping are always re-read from the database when checkout starts, and stock is reserved for the length of the Stripe session.
- **Payments**: Stripe hosted Checkout. An order is marked paid only after the server confirms it with Stripe, through a signed webhook with a reconcile job as a backstop.
- **Admin** (`/admin`): create and hide products, manage categories, adjust stock and review orders.

## Prerequisites

- Node.js 20 or newer
- [pnpm](https://pnpm.io). Use it for everything; do not use `npm`, `npx` or `yarn`.
- A [Neon](https://neon.tech) Postgres database
- A [Stripe](https://stripe.com) account and the [Stripe CLI](https://docs.stripe.com/stripe-cli), for checkout only

## Quick start

```bash
pnpm install
cp .env.example .env.local   # then fill in the values below
pnpm db:migrate              # create the tables
pnpm db:seed                 # load sample products (wipes the catalog)
pnpm dev
```

Open <http://localhost:3000>.

Browsing, accounts and the cart need only `DATABASE_URL`, `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`. Add the Stripe variables to test checkout.

### Environment variables

| Variable | Required for | Notes |
| --- | --- | --- |
| `DATABASE_URL` | `dev`, `build` | Neon **pooled** connection string. The app throws at import time without it. |
| `BETTER_AUTH_SECRET` | Sign-in | A long random string. |
| `BETTER_AUTH_URL` | Sign-in, checkout | The site origin, for example `http://localhost:3000`. Also used for Stripe return URLs. |
| `STRIPE_SECRET_KEY` | Checkout | Stripe API secret key. |
| `STRIPE_WEBHOOK_SECRET` | Checkout | Signing secret printed by `stripe listen`. |
| `CRON_SECRET` | Order reconcile job | Bearer token for `/api/cron/reconcile-orders`. The route stays closed when unset. |

### Testing checkout locally

Forward Stripe events to your dev server (the CLI requires `--events`):

```bash
stripe listen \
  --events checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed,checkout.session.expired \
  --forward-to localhost:3000/api/stripe/webhook
```

Copy the `whsec_...` secret it prints into `STRIPE_WEBHOOK_SECRET`, then pay with a [Stripe test card](https://docs.stripe.com/testing).

### Creating the first admin

There is no admin sign-up. Create an account in the store, then promote it:

```bash
pnpm db:make-admin you@example.com
```

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` / `build` / `start` | Run the Next.js dev server, build, or serve the build |
| `pnpm typecheck` | Generate route types, then run `tsc` |
| `pnpm lint` | Run ESLint |
| `pnpm check:admin` | Fail if any admin page, action or route skips `requireAdmin` |
| `pnpm db:generate` | Create a SQL migration in `drizzle/` from the schema |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:seed` | Wipe and reload the catalog (development only) |
| `pnpm db:make-admin <email>` | Give an existing user the admin role |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm db:push` | Push the schema without a migration (throwaway prototyping only) |

There is no test framework yet. Run `pnpm typecheck`, `pnpm lint` and `pnpm check:admin` before you commit.

## Project layout

```
src/
  app/            Routes: storefront, account, cart, checkout, admin, api
    api/          Better Auth, Stripe webhook, order reconcile cron
  components/     UI components; admin-only ones are in components/admin
  db/             Drizzle schema, client, seed and admin scripts
  lib/            Server logic: auth, session, cart, orders, checkout, queries
  proxy.ts        Redirects signed-out visitors away from /account and /admin
scripts/          Repo checks (check-admin-guards.ts)
drizzle/          Generated SQL migrations
```

## How it works

- **Database changes**: edit the schema in `src/db`, run `pnpm db:generate`, review the SQL in `drizzle/`, then `pnpm db:migrate`. Never edit a migration that has already been applied.
- **Authorization** is checked inside every page, Server Action and Route Handler, not only in the proxy. See `src/lib/session.ts`.
- **Money** is stored as integer cents.
- **Orders** are reserved when checkout starts and settled only from Stripe's records, never from the success page or a cookie.

## Deploying

Set the environment variables above on your host and run `pnpm build`. Point a Stripe webhook endpoint at `/api/stripe/webhook` with the four events listed in the checkout section. Schedule a request to `/api/cron/reconcile-orders` with the header `Authorization: Bearer $CRON_SECRET`, because stale pending orders are settled by that job and your host must trigger it.

## Contributing and AI tools

Conventions for the schema, auth, admin area and checkout, including rules for AI coding agents, are in [AGENTS.md](./AGENTS.md). Read it before changing code.
