import { Either, left, right } from '../../../domain/either';
import { Product } from '../../../domain/entities/product.entity';
import { NotFoundError } from '../../../domain/errors/domain.error';
import { ICategoryRepository } from '../../../domain/repositories/category.repository';
import {
  CreateProductData,
  IProductRepository,
} from '../../../domain/repositories/product.repository';

export class CreateProductUseCase {
  constructor(
    private readonly productRepo: IProductRepository,
    private readonly categoryRepo: ICategoryRepository,
  ) {}

  async execute(data: CreateProductData): Promise<Either<NotFoundError, Product>> {
    const category = await this.categoryRepo.findById(data.categoryId);
    if (!category) {
      return left(new NotFoundError('Category'));
    }

    const product = await this.productRepo.create(data);
    return right(product);
  }
}
