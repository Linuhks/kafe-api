import { Injectable } from '@nestjs/common';
import { eq, count, and } from 'drizzle-orm';
import { DrizzleService } from '../drizzle.service.js';
import { products } from '../schema.js';
import { Product } from '../../../domain/entities/product.entity.js';
import {
  CreateProductData,
  IProductRepository,
  UpdateProductData,
} from '../../../domain/repositories/product.repository.js';

function mapToProduct(row: typeof products.$inferSelect): Product {
  return new Product(
    row.id,
    row.categoryId,
    row.name,
    row.description ?? null,
    row.price,
    row.imageUrl ?? null,
    row.isAvailable,
    row.createdAt,
    row.updatedAt,
  );
}

@Injectable()
export class DrizzleProductRepository extends IProductRepository {
  constructor(private readonly drizzleService: DrizzleService) {
    super();
  }

  private get db() {
    return this.drizzleService.db;
  }

  async findById(id: string): Promise<Product | null> {
    const rows = await this.db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    return rows[0] ? mapToProduct(rows[0]) : null;
  }

  async findAll(
    page: number,
    limit: number,
    categoryId?: string,
  ): Promise<{ data: Product[]; total: number }> {
    const offset = (page - 1) * limit;
    const where = categoryId ? eq(products.categoryId, categoryId) : undefined;

    const [rows, [countRow]] = await Promise.all([
      this.db
        .select()
        .from(products)
        .where(where)
        .limit(limit)
        .offset(offset),
      this.db
        .select({ total: count() })
        .from(products)
        .where(where),
    ]);

    return {
      data: rows.map(mapToProduct),
      total: Number(countRow.total),
    };
  }

  async create(data: CreateProductData): Promise<Product> {
    const [row] = await this.db
      .insert(products)
      .values({
        categoryId: data.categoryId,
        name: data.name,
        description: data.description,
        price: data.price,
        imageUrl: data.imageUrl,
        isAvailable: data.isAvailable ?? true,
      })
      .returning();

    return mapToProduct(row);
  }

  async update(id: string, data: UpdateProductData): Promise<Product> {
    const values: Partial<typeof products.$inferInsert> = {};
    if (data.categoryId !== undefined) values.categoryId = data.categoryId;
    if (data.name !== undefined) values.name = data.name;
    if (data.description !== undefined) values.description = data.description;
    if (data.price !== undefined) values.price = data.price;
    if (data.imageUrl !== undefined) values.imageUrl = data.imageUrl;
    if (data.isAvailable !== undefined) values.isAvailable = data.isAvailable;

    await this.db
      .update(products)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(products.id, id));

    return this.findById(id) as Promise<Product>;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(products).where(eq(products.id, id));
  }
}
