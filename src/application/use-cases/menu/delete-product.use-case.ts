import { Either, left, right } from '../../../domain/either';
import { NotFoundError } from '../../../domain/errors/domain.error';
import { IProductRepository } from '../../../domain/repositories/product.repository';

export class DeleteProductUseCase {
  constructor(private readonly productRepo: IProductRepository) {}

  async execute(id: string): Promise<Either<NotFoundError, void>> {
    const existing = await this.productRepo.findById(id);
    if (!existing) {
      return left(new NotFoundError('Product'));
    }

    await this.productRepo.delete(id);
    return right(undefined);
  }
}
