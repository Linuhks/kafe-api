import { Category } from '../../../domain/entities/category.entity.js';
import { ConflictError } from '../../../domain/errors/domain.error.js';
import {
  CreateCategoryData,
  ICategoryRepository,
} from '../../../domain/repositories/category.repository.js';

export class CreateCategoryUseCase {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async execute(data: CreateCategoryData): Promise<Category> {
    const existing = await this.categoryRepo.findByName(data.name);
    if (existing) {
      throw new ConflictError('Category name already in use');
    }

    return this.categoryRepo.create(data);
  }
}
