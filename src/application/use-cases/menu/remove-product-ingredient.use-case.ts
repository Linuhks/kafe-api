import { NotFoundError } from '../../../domain/errors/domain.error.js';
import type { IProductRepository } from '../../../domain/repositories/product.repository.js';
import type { IProductIngredientRepository } from '../../../domain/repositories/product-ingredient.repository.js';

export class RemoveProductIngredientUseCase {
  constructor(
    private readonly productRepo: IProductRepository,
    private readonly productIngredientRepo: IProductIngredientRepository,
  ) {}

  async execute(productId: string, ingredientId: string): Promise<void> {
    const product = await this.productRepo.findById(productId);
    if (!product) throw new NotFoundError(`Product ${productId}`);

    await this.productIngredientRepo.delete(productId, ingredientId);
  }
}
