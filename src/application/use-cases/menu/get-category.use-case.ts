import type { Category } from '../../../domain/entities/category.entity.js';
import { NotFoundError } from '../../../domain/errors/domain.error.js';
import type { ICategoryRepository } from '../../../domain/repositories/category.repository.js';

export class GetCategoryUseCase {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async execute(id: string): Promise<Category> {
    const category = await this.categoryRepo.findById(id);
    if (!category) {
      throw new NotFoundError('Category');
    }
    return category;
  }
}
