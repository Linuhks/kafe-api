import { Either, left, right } from '../../../domain/either';
import { NotFoundError } from '../../../domain/errors/domain.error';
import { ICategoryRepository } from '../../../domain/repositories/category.repository';

export class DeleteCategoryUseCase {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async execute(id: string): Promise<Either<NotFoundError, void>> {
    const existing = await this.categoryRepo.findById(id);
    if (!existing) {
      return left(new NotFoundError('Category'));
    }

    await this.categoryRepo.delete(id);
    return right(undefined);
  }
}
