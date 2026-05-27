import { Either, left, right } from '../../../domain/either';
import { Product } from '../../../domain/entities/product.entity';
import { NotFoundError } from '../../../domain/errors/domain.error';
import { ICategoryRepository } from '../../../domain/repositories/category.repository';
import {
  IProductRepository,
  UpdateProductData,
} from '../../../domain/repositories/product.repository';

export class UpdateProductUseCase {
  constructor(
    private readonly productRepo: IProductRepository,
    private readonly categoryRepo: ICategoryRepository,
  ) {}

  async execute(id: string, data: UpdateProductData): Promise<Either<NotFoundError, Product>> {
    const existing = await this.productRepo.findById(id);
    if (!existing) {
      return left(new NotFoundError('Product'));
    }

    if (data.categoryId) {
      const category = await this.categoryRepo.findById(data.categoryId);
      if (!category) {
        return left(new NotFoundError('Category'));
      }
    }

    const updated = await this.productRepo.update(id, data);
    return right(updated);
  }
}
