import { Product } from '../../../domain/entities/product.entity';
import { NotFoundError } from '../../../domain/errors/domain.error';
import { IProductRepository } from '../../../domain/repositories/product.repository';

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
