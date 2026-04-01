import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DrizzleService } from '../drizzle.service.js';
import { productIngredients } from '../schema.js';
import { ProductIngredient } from '../../../domain/entities/product-ingredient.entity.js';
import {
  IProductIngredientRepository,
  CreateProductIngredientData,
} from '../../../domain/repositories/product-ingredient.repository.js';

function mapToProductIngredient(row: typeof productIngredients.$inferSelect): ProductIngredient {
  return new ProductIngredient(row.id, row.productId, row.ingredientId, row.quantity);
}

@Injectable()
export class DrizzleProductIngredientRepository extends IProductIngredientRepository {
  constructor(private readonly drizzleService: DrizzleService) {
    super();
  }

  private get db() {
    return this.drizzleService.db;
  }

  async findByProductId(productId: string): Promise<ProductIngredient[]> {
    const rows = await this.db
      .select()
      .from(productIngredients)
      .where(eq(productIngredients.productId, productId));
    return rows.map(mapToProductIngredient);
  }

  async save(data: CreateProductIngredientData): Promise<ProductIngredient> {
    const [row] = await this.db
      .insert(productIngredients)
      .values({
        productId: data.productId,
        ingredientId: data.ingredientId,
        quantity: data.quantity,
      })
      .returning();
    return mapToProductIngredient(row);
  }

  async delete(productId: string, ingredientId: string): Promise<void> {
    await this.db
      .delete(productIngredients)
      .where(
        and(
          eq(productIngredients.productId, productId),
          eq(productIngredients.ingredientId, ingredientId),
        ),
      );
  }
}
