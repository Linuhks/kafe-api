import { Either, left, right } from '../../../domain/either';
import { ConflictError, NotFoundError } from '../../../domain/errors/domain.error';
import { ICategoryRepository } from '../../../domain/repositories/category.repository';
import { IProductRepository } from '../../../domain/repositories/product.repository';

export class DeleteCategoryUseCase {
  constructor(
    private readonly categoryRepo: ICategoryRepository,
    private readonly productRepo: IProductRepository,
  ) {}

  async execute(id: string): Promise<Either<NotFoundError | ConflictError, void>> {
    const existing = await this.categoryRepo.findById(id);
    if (!existing) {
      return left(new NotFoundError('Category'));
    }

    const { total } = await this.productRepo.findAll(1, 1, id);
    if (total > 0) {
      return left(new ConflictError('Category has linked products and cannot be deleted'));
    }

    await this.categoryRepo.delete(id);
    return right(undefined);
  }
}
