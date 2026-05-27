import { Either, left, right } from '../../../domain/either';
import { Category } from '../../../domain/entities/category.entity';
import { ConflictError } from '../../../domain/errors/domain.error';
import {
  CreateCategoryData,
  ICategoryRepository,
} from '../../../domain/repositories/category.repository';

export class CreateCategoryUseCase {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async execute(data: CreateCategoryData): Promise<Either<ConflictError, Category>> {
    const existing = await this.categoryRepo.findByName(data.name);
    if (existing) {
      return left(new ConflictError('Category name already in use'));
    }

    const category = await this.categoryRepo.create(data);
    return right(category);
  }
}
