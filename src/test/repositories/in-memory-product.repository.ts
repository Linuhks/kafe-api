import { Product } from '../../domain/entities/product.entity.js';
import {
  type CreateProductData,
  IProductRepository,
  type UpdateProductData,
} from '../../domain/repositories/product.repository.js';

export class InMemoryProductRepository extends IProductRepository {
  items: Product[] = [];
  private counter = 0;

  async findById(id: string): Promise<Product | null> {
    return this.items.find((p) => p.id === id) ?? null;
  }

  async findAll(
    page: number,
    limit: number,
    categoryId?: string,
  ): Promise<{ data: Product[]; total: number }> {
    const filtered = categoryId
      ? this.items.filter((p) => p.categoryId === categoryId)
      : this.items;
    const start = (page - 1) * limit;
    return {
      data: filtered.slice(start, start + limit),
      total: filtered.length,
    };
  }

  async create(data: CreateProductData): Promise<Product> {
    const product = new Product(
      `prod-${++this.counter}`,
      data.categoryId,
      data.name,
      data.description ?? null,
      data.price,
      data.imageUrl ?? null,
      data.isAvailable ?? true,
      new Date(),
      new Date(),
    );
    this.items.push(product);
    return product;
  }

  async update(id: string, data: UpdateProductData): Promise<Product> {
    const idx = this.items.findIndex((p) => p.id === id);
    const existing = this.items[idx];
    const updated = new Product(
      existing.id,
      data.categoryId ?? existing.categoryId,
      data.name ?? existing.name,
      data.description !== undefined ? (data.description ?? null) : existing.description,
      data.price ?? existing.price,
      data.imageUrl !== undefined ? (data.imageUrl ?? null) : existing.imageUrl,
      data.isAvailable ?? existing.isAvailable,
      existing.createdAt,
      new Date(),
    );
    this.items[idx] = updated;
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.items = this.items.filter((p) => p.id !== id);
  }
}
