import type { Product } from '../entities/product.entity.js';

export interface CreateProductData {
  categoryId: string;
  name: string;
  description?: string;
  price: string;
  imageUrl?: string;
  isAvailable?: boolean;
}

export interface UpdateProductData {
  categoryId?: string;
  name?: string;
  description?: string;
  price?: string;
  imageUrl?: string;
  isAvailable?: boolean;
}

export abstract class IProductRepository {
  abstract findById(id: string): Promise<Product | null>;
  abstract findAll(
    page: number,
    limit: number,
    categoryId?: string,
  ): Promise<{ data: Product[]; total: number }>;
  abstract create(data: CreateProductData): Promise<Product>;
  abstract update(id: string, data: UpdateProductData): Promise<Product>;
  abstract delete(id: string): Promise<void>;
}
