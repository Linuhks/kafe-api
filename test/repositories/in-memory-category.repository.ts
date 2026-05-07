import { Category } from '../../src/domain/entities/category.entity';
import {
  type CreateCategoryData,
  ICategoryRepository,
  type UpdateCategoryData,
} from '../../src/domain/repositories/category.repository';

export class InMemoryCategoryRepository extends ICategoryRepository {
  items: Category[] = [];
  private counter = 0;

  async findById(id: string): Promise<Category | null> {
    return this.items.find((c) => c.id === id) ?? null;
  }

  async findByName(name: string): Promise<Category | null> {
    return this.items.find((c) => c.name === name) ?? null;
  }

  async findAll(page: number, limit: number): Promise<{ data: Category[]; total: number }> {
    const start = (page - 1) * limit;
    return {
      data: this.items.slice(start, start + limit),
      total: this.items.length,
    };
  }

  async create(data: CreateCategoryData): Promise<Category> {
    const category = new Category(
      `cat-${++this.counter}`,
      data.name,
      data.description ?? null,
      data.sortOrder ?? 0,
      true,
      new Date(),
    );
    this.items.push(category);
    return category;
  }

  async update(id: string, data: UpdateCategoryData): Promise<Category> {
    const idx = this.items.findIndex((c) => c.id === id);
    const existing = this.items[idx];
    const updated = new Category(
      existing.id,
      data.name ?? existing.name,
      data.description !== undefined ? (data.description ?? null) : existing.description,
      data.sortOrder ?? existing.sortOrder,
      data.isActive ?? existing.isActive,
      existing.createdAt,
    );
    this.items[idx] = updated;
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.items = this.items.filter((c) => c.id !== id);
  }
}
