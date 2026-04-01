import type { Product } from '../../../domain/entities/product.entity.js';
import { NotFoundError } from '../../../domain/errors/domain.error.js';
import type { ICategoryRepository } from '../../../domain/repositories/category.repository.js';
import type {
  IProductRepository,
  UpdateProductData,
} from '../../../domain/repositories/product.repository.js';

export class UpdateProductUseCase {
  constructor(
    private readonly productRepo: IProductRepository,
    private readonly categoryRepo: ICategoryRepository,
  ) {}

  async execute(id: string, data: UpdateProductData): Promise<Product> {
    const existing = await this.productRepo.findById(id);
    if (!existing) {
      throw new NotFoundError('Product');
    }

    if (data.categoryId) {
      const category = await this.categoryRepo.findById(data.categoryId);
      if (!category) {
        throw new NotFoundError('Category');
      }
    }

    return this.productRepo.update(id, data);
  }
}
