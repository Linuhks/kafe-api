import { Either, left, right } from '../../../domain/either';
import { Product } from '../../../domain/entities/product.entity';
import { NotFoundError } from '../../../domain/errors/domain.error';
import { IProductRepository } from '../../../domain/repositories/product.repository';

export class GetProductUseCase {
  constructor(private readonly productRepo: IProductRepository) {}

  async execute(id: string): Promise<Either<NotFoundError, Product>> {
    const product = await this.productRepo.findById(id);
    if (!product) {
      return left(new NotFoundError('Product'));
    }
    return right(product);
  }
}
