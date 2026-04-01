import { ProductIngredient } from '../../../domain/entities/product-ingredient.entity.js';
import { NotFoundError } from '../../../domain/errors/domain.error.js';
import { IProductIngredientRepository } from '../../../domain/repositories/product-ingredient.repository.js';
import { IProductRepository } from '../../../domain/repositories/product.repository.js';

export class ListProductIngredientsUseCase {
  constructor(
    private readonly productRepo: IProductRepository,
    private readonly productIngredientRepo: IProductIngredientRepository,
  ) {}

  async execute(productId: string): Promise<ProductIngredient[]> {
    const product = await this.productRepo.findById(productId);
    if (!product) throw new NotFoundError(`Product ${productId}`);

    return this.productIngredientRepo.findByProductId(productId);
  }
}
