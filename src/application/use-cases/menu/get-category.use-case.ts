import { Category } from '../../../domain/entities/category.entity';
import { NotFoundError } from '../../../domain/errors/domain.error';
import { ICategoryRepository } from '../../../domain/repositories/category.repository';

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
