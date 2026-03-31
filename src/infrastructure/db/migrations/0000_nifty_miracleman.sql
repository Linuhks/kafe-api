CREATE TYPE "public"."movement_type" AS ENUM('DEDUCTION', 'RESTOCK', 'ADJUSTMENT');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('RECEIVED', 'IN_PREPARATION', 'READY', 'DELIVERED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'BARISTA', 'CLIENT');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingredients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"unit" varchar(50) NOT NULL,
	"current_stock" numeric(10, 3) DEFAULT '0' NOT NULL,
	"minimum_stock" numeric(10, 3) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ingredient_id" uuid NOT NULL,
	"order_id" uuid,
	"type" "movement_type" NOT NULL,
	"quantity" numeric(10, 3) NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"product_name" text NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"quantity" integer NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" text,
	"client_name" varchar(255),
	"barista_id" text,
	"status" "order_status" DEFAULT 'RECEIVED' NOT NULL,
	"notes" text,
	"total_amount" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_ingredients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"ingredient_id" uuid NOT NULL,
	"quantity" numeric(10, 3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"image_url" text,
	"is_available" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_ingredients" ADD CONSTRAINT "product_ingredients_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_ingredients" ADD CONSTRAINT "product_ingredients_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;