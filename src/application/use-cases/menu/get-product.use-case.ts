import type { Product } from '../../../domain/entities/product.entity.js';
import { NotFoundError } from '../../../domain/errors/domain.error.js';
import type { IProductRepository } from '../../../domain/repositories/product.repository.js';

export class GetProductUseCase {
  constructor(private readonly productRepo: IProductRepository) {}

  async execute(id: string): Promise<Product> {
    const product = await this.productRepo.findById(id);
    if (!product) {
      throw new NotFoundError('Product');
    }
    return product;
  }
}
