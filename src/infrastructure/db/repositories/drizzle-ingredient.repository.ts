import { Injectable } from '@nestjs/common';
import { count, eq, sql } from 'drizzle-orm';
import { Ingredient } from '../../../domain/entities/ingredient.entity';
import {
  type CreateIngredientData,
  IIngredientRepository,
  type ProductIngredientRow,
  type UpdateIngredientData,
} from '../../../domain/repositories/ingredient.repository';
import { DrizzleService } from '../drizzle.service';
import { ingredients, productIngredients } from '../schema';

function mapToIngredient(row: typeof ingredients.$inferSelect): Ingredient {
  return new Ingredient(
    row.id,
    row.name,
    row.unit,
    row.currentStock,
    row.minimumStock,
    row.createdAt,
    row.updatedAt,
  );
}

@Injectable()
export class DrizzleIngredientRepository extends IIngredientRepository {
  constructor(private readonly drizzleService: DrizzleService) {
    super();
  }

  private get db() {
    return this.drizzleService.db;
  }

  async findById(id: string): Promise<Ingredient | null> {
    const rows = await this.db.select().from(ingredients).where(eq(ingredients.id, id)).limit(1);
    return rows[0] ? mapToIngredient(rows[0]) : null;
  }

  async findAll(page: number, limit: number): Promise<{ data: Ingredient[]; total: number }> {
    const offset = (page - 1) * limit;
    const [rows, [countRow]] = await Promise.all([
      this.db.select().from(ingredients).limit(limit).offset(offset),
      this.db.select({ total: count() }).from(ingredients),
    ]);
    return { data: rows.map(mapToIngredient), total: Number(countRow.total) };
  }

  async create(data: CreateIngredientData): Promise<Ingredient> {
    const [row] = await this.db
      .insert(ingredients)
      .values({
        name: data.name,
        unit: data.unit,
        currentStock: data.currentStock ?? '0',
        minimumStock: data.minimumStock ?? '0',
      })
      .returning();
    return mapToIngredient(row);
  }

  async update(id: string, data: UpdateIngredientData): Promise<Ingredient> {
    const values: Partial<typeof ingredients.$inferInsert> = { updatedAt: new Date() };
    if (data.name !== undefined) values.name = data.name;
    if (data.unit !== undefined) values.unit = data.unit;
    if (data.minimumStock !== undefined) values.minimumStock = data.minimumStock;
    await this.db.update(ingredients).set(values).where(eq(ingredients.id, id));
    return this.findById(id) as Promise<Ingredient>;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(ingredients).where(eq(ingredients.id, id));
  }

  async deductStock(id: string, quantity: string): Promise<Ingredient> {
    await this.db
      .update(ingredients)
      .set({
        currentStock: sql`${ingredients.currentStock} - ${quantity}::numeric`,
        updatedAt: new Date(),
      })
      .where(eq(ingredients.id, id));
    return this.findById(id) as Promise<Ingredient>;
  }

  async deductStockIfSufficient(id: string, quantity: string): Promise<boolean> {
    const rows = await this.db
      .update(ingredients)
      .set({
        currentStock: sql`${ingredients.currentStock} - ${quantity}::numeric`,
        updatedAt: new Date(),
      })
      .where(sql`${ingredients.id} = ${id} AND ${ingredients.currentStock} >= ${quantity}::numeric`)
      .returning({ id: ingredients.id });
    return rows.length > 0;
  }

  async restockIngredient(id: string, quantity: string): Promise<Ingredient> {
    await this.db
      .update(ingredients)
      .set({
        currentStock: sql`${ingredients.currentStock} + ${quantity}::numeric`,
        updatedAt: new Date(),
      })
      .where(eq(ingredients.id, id));
    return this.findById(id) as Promise<Ingredient>;
  }

  async findRecipeByProductId(productId: string): Promise<ProductIngredientRow[]> {
    const rows = await this.db
      .select({
        ingredientId: productIngredients.ingredientId,
        quantity: productIngredients.quantity,
      })
      .from(productIngredients)
      .where(eq(productIngredients.productId, productId));
    return rows;
  }

  async findByName(name: string): Promise<Ingredient | null> {
    const rows = await this.db
      .select()
      .from(ingredients)
      .where(eq(ingredients.name, name))
      .limit(1);
    return rows[0] ? mapToIngredient(rows[0]) : null;
  }

  async findLowStock(): Promise<Ingredient[]> {
    const rows = await this.db
      .select()
      .from(ingredients)
      .where(sql`${ingredients.currentStock} < ${ingredients.minimumStock}`);
    return rows.map(mapToIngredient);
  }
}
