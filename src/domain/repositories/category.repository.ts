import type { Category } from '../entities/category.entity.js';

export interface CreateCategoryData {
  name: string;
  description?: string;
  sortOrder?: number;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export abstract class ICategoryRepository {
  abstract findById(id: string): Promise<Category | null>;
  abstract findByName(name: string): Promise<Category | null>;
  abstract findAll(page: number, limit: number): Promise<{ data: Category[]; total: number }>;
  abstract create(data: CreateCategoryData): Promise<Category>;
  abstract update(id: string, data: UpdateCategoryData): Promise<Category>;
  abstract delete(id: string): Promise<void>;
}
