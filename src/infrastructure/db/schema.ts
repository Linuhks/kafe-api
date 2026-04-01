import {
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

// ─── Enums ───────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum('user_role', ['ADMIN', 'BARISTA', 'CLIENT']);

export const orderStatusEnum = pgEnum('order_status', [
  'RECEIVED',
  'IN_PREPARATION',
  'READY',
  'DELIVERED',
  'CANCELLED',
]);

export const movementTypeEnum = pgEnum('movement_type', ['DEDUCTION', 'RESTOCK', 'ADJUSTMENT']);

// ─── Categories ───────────────────────────────────────────────────────────────

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─── Products ─────────────────────────────────────────────────────────────────

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => categories.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  imageUrl: text('image_url'),
  isAvailable: boolean('is_available').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── Ingredients ──────────────────────────────────────────────────────────────

export const ingredients = pgTable('ingredients', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  unit: varchar('unit', { length: 50 }).notNull(),
  currentStock: numeric('current_stock', { precision: 10, scale: 3 }).notNull().default('0'),
  minimumStock: numeric('minimum_stock', { precision: 10, scale: 3 }).notNull().default('0'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── Product Ingredients ──────────────────────────────────────────────────────

export const productIngredients = pgTable('product_ingredients', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  ingredientId: uuid('ingredient_id')
    .notNull()
    .references(() => ingredients.id),
  quantity: numeric('quantity', { precision: 10, scale: 3 }).notNull(),
});

// ─── Orders ───────────────────────────────────────────────────────────────────

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  // FK → user.id da tabela gerada pelo better-auth (sem cascade — preserva histórico)
  clientId: text('client_id'),
  clientName: varchar('client_name', { length: 255 }),
  baristaId: text('barista_id'),
  status: orderStatusEnum('status').notNull().default('RECEIVED'),
  notes: text('notes'),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── Order Items ──────────────────────────────────────────────────────────────

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id),
  // Snapshots de nome e preço no momento do pedido
  productName: text('product_name').notNull(),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  quantity: integer('quantity').notNull(),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
});

// ─── Inventory Movements ──────────────────────────────────────────────────────

export const inventoryMovements = pgTable('inventory_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  ingredientId: uuid('ingredient_id')
    .notNull()
    .references(() => ingredients.id),
  orderId: uuid('order_id').references(() => orders.id),
  type: movementTypeEnum('type').notNull(),
  quantity: numeric('quantity', { precision: 10, scale: 3 }).notNull(),
  note: text('note'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
