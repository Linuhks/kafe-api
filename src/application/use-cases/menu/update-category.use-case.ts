import { Category } from '../../../domain/entities/category.entity.js';
import { NotFoundError } from '../../../domain/errors/domain.error.js';
import {
  ICategoryRepository,
  UpdateCategoryData,
} from '../../../domain/repositories/category.repository.js';

export class UpdateCategoryUseCase {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async execute(id: string, data: UpdateCategoryData): Promise<Category> {
    const existing = await this.categoryRepo.findById(id);
    if (!existing) {
      throw new NotFoundError('Category');
    }

    return this.categoryRepo.update(id, data);
  }
}
