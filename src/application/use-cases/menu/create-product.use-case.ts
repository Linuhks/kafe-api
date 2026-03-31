import { Product } from '../../../domain/entities/product.entity.js';
import { NotFoundError } from '../../../domain/errors/domain.error.js';
import { ICategoryRepository } from '../../../domain/repositories/category.repository.js';
import {
  CreateProductData,
  IProductRepository,
} from '../../../domain/repositories/product.repository.js';

export class CreateProductUseCase {
  constructor(
    private readonly productRepo: IProductRepository,
    private readonly categoryRepo: ICategoryRepository,
  ) {}

  async execute(data: CreateProductData): Promise<Product> {
    const category = await this.categoryRepo.findById(data.categoryId);
    if (!category) {
      throw new NotFoundError('Category');
    }

    return this.productRepo.create(data);
  }
}
