import { Product } from '../../../domain/entities/product.entity';
import { NotFoundError } from '../../../domain/errors/domain.error';
import { IProductRepository } from '../../../domain/repositories/product.repository';

export class ToggleAvailabilityUseCase {
  constructor(private readonly productRepo: IProductRepository) {}

  async execute(id: string): Promise<Product> {
    const existing = await this.productRepo.findById(id);
    if (!existing) {
      throw new NotFoundError('Product');
    }

    return this.productRepo.update(id, { isAvailable: !existing.isAvailable });
  }
}
