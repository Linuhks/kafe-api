import { Either, left, right } from '../../../domain/either';
import { Product } from '../../../domain/entities/product.entity';
import { NotFoundError } from '../../../domain/errors/domain.error';
import { IProductRepository } from '../../../domain/repositories/product.repository';

export class ToggleAvailabilityUseCase {
  constructor(private readonly productRepo: IProductRepository) {}

  async execute(id: string): Promise<Either<NotFoundError, Product>> {
    const existing = await this.productRepo.findById(id);
    if (!existing) {
      return left(new NotFoundError('Product'));
    }

    const updated = await this.productRepo.update(id, { isAvailable: !existing.isAvailable });
    return right(updated);
  }
}
