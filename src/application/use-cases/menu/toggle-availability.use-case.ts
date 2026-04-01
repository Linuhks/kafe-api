import type { Product } from '../../../domain/entities/product.entity.js';
import { NotFoundError } from '../../../domain/errors/domain.error.js';
import type { IProductRepository } from '../../../domain/repositories/product.repository.js';

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
