import { Either, left, right } from '../../../domain/either';
import { Category } from '../../../domain/entities/category.entity';
import { NotFoundError } from '../../../domain/errors/domain.error';
import { ICategoryRepository } from '../../../domain/repositories/category.repository';

export class GetCategoryUseCase {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async execute(id: string): Promise<Either<NotFoundError, Category>> {
    const category = await this.categoryRepo.findById(id);
    if (!category) {
      return left(new NotFoundError('Category'));
    }
    return right(category);
  }
}
