import { Injectable } from '@nestjs/common';
import { count, eq, ilike } from 'drizzle-orm';
import { Category } from '../../../domain/entities/category.entity.js';
import {
  type CreateCategoryData,
  ICategoryRepository,
  type UpdateCategoryData,
} from '../../../domain/repositories/category.repository.js';
import type { DrizzleService } from '../drizzle.service.js';
import { categories } from '../schema.js';

function mapToCategory(row: typeof categories.$inferSelect): Category {
  return new Category(
    row.id,
    row.name,
    row.description ?? null,
    row.sortOrder,
    row.isActive,
    row.createdAt,
  );
}

@Injectable()
export class DrizzleCategoryRepository extends ICategoryRepository {
  constructor(private readonly drizzleService: DrizzleService) {
    super();
  }

  private get db() {
    return this.drizzleService.db;
  }

  async findById(id: string): Promise<Category | null> {
    const rows = await this.db.select().from(categories).where(eq(categories.id, id)).limit(1);
    return rows[0] ? mapToCategory(rows[0]) : null;
  }

  async findByName(name: string): Promise<Category | null> {
    const rows = await this.db
      .select()
      .from(categories)
      .where(ilike(categories.name, name))
      .limit(1);
    return rows[0] ? mapToCategory(rows[0]) : null;
  }

  async findAll(page: number, limit: number): Promise<{ data: Category[]; total: number }> {
    const offset = (page - 1) * limit;

    const [rows, [countRow]] = await Promise.all([
      this.db.select().from(categories).limit(limit).offset(offset),
      this.db.select({ total: count() }).from(categories),
    ]);

    return {
      data: rows.map(mapToCategory),
      total: Number(countRow.total),
    };
  }

  async create(data: CreateCategoryData): Promise<Category> {
    const [row] = await this.db
      .insert(categories)
      .values({
        name: data.name,
        description: data.description,
        sortOrder: data.sortOrder ?? 0,
      })
      .returning();

    return mapToCategory(row);
  }

  async update(id: string, data: UpdateCategoryData): Promise<Category> {
    const values: Partial<typeof categories.$inferInsert> = {};
    if (data.name !== undefined) values.name = data.name;
    if (data.description !== undefined) values.description = data.description;
    if (data.sortOrder !== undefined) values.sortOrder = data.sortOrder;
    if (data.isActive !== undefined) values.isActive = data.isActive;

    await this.db.update(categories).set(values).where(eq(categories.id, id));

    return this.findById(id) as Promise<Category>;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(categories).where(eq(categories.id, id));
  }
}
