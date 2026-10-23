CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'failed', 'expired');--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "order_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"order_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"product_slug" text NOT NULL,
	"reference" text NOT NULL,
	"name" text NOT NULL,
	"size" text NOT NULL,
	"color" text,
	"unit_price_cents" integer NOT NULL,
	"quantity" integer NOT NULL,
	CONSTRAINT "order_items_unit_price_positive" CHECK ("order_items"."unit_price_cents" > 0),
	CONSTRAINT "order_items_quantity_positive" CHECK ("order_items"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "orders_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"public_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"payment_status" "payment_status" DEFAULT 'pending' NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"subtotal_cents" integer NOT NULL,
	"shipping_cents" integer NOT NULL,
	"total_cents" integer NOT NULL,
	"stripe_checkout_session_id" text,
	"stripe_payment_intent_id" text,
	"reserved_until" timestamp with time zone NOT NULL,
	"stock_released_at" timestamp with time zone,
	"needs_review_reason" text,
	"email" text,
	"shipping_name" text,
	"shipping_address" jsonb,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_public_id_unique" UNIQUE("public_id"),
	CONSTRAINT "orders_stripe_checkout_session_id_unique" UNIQUE("stripe_checkout_session_id"),
	CONSTRAINT "orders_stripe_payment_intent_id_unique" UNIQUE("stripe_payment_intent_id"),
	CONSTRAINT "orders_currency_usd" CHECK ("orders"."currency" = 'usd'),
	CONSTRAINT "orders_subtotal_positive" CHECK ("orders"."subtotal_cents" > 0),
	CONSTRAINT "orders_shipping_non_negative" CHECK ("orders"."shipping_cents" >= 0),
	CONSTRAINT "orders_total_is_subtotal_plus_shipping" CHECK ("orders"."total_cents" = "orders"."subtotal_cents" + "orders"."shipping_cents"),
	CONSTRAINT "orders_paid_has_paid_at" CHECK (("orders"."payment_status" = 'paid') = ("orders"."paid_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "stripe_events" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"order_id" integer,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stripe_events" ADD CONSTRAINT "stripe_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "order_items_order_id_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_product_id_idx" ON "order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "orders_user_id_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_pending_reserved_until_idx" ON "orders" USING btree ("reserved_until") WHERE "orders"."payment_status" = 'pending';--> statement-breakpoint
CREATE UNIQUE INDEX "orders_one_pending_per_user_idx" ON "orders" USING btree ("user_id") WHERE "orders"."payment_status" = 'pending';