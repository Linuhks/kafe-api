import { NotFoundError } from '../../../domain/errors/domain.error.js';
import type { IProductRepository } from '../../../domain/repositories/product.repository.js';

export class DeleteProductUseCase {
  constructor(private readonly productRepo: IProductRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.productRepo.findById(id);
    if (!existing) {
      throw new NotFoundError('Product');
    }

    await this.productRepo.delete(id);
  }
}
