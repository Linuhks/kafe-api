import { Either, left, right } from '../../../domain/either';
import { Category } from '../../../domain/entities/category.entity';
import { NotFoundError } from '../../../domain/errors/domain.error';
import {
  ICategoryRepository,
  UpdateCategoryData,
} from '../../../domain/repositories/category.repository';

export class UpdateCategoryUseCase {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async execute(id: string, data: UpdateCategoryData): Promise<Either<NotFoundError, Category>> {
    const existing = await this.categoryRepo.findById(id);
    if (!existing) {
      return left(new NotFoundError('Category'));
    }

    const updated = await this.categoryRepo.update(id, data);
    return right(updated);
  }
}
