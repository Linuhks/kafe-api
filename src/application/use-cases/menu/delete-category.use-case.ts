import { NotFoundError } from '../../../domain/errors/domain.error.js';
import type { ICategoryRepository } from '../../../domain/repositories/category.repository.js';

export class DeleteCategoryUseCase {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.categoryRepo.findById(id);
    if (!existing) {
      throw new NotFoundError('Category');
    }

    await this.categoryRepo.delete(id);
  }
}
