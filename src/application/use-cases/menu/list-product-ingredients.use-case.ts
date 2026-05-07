import { ProductIngredient } from '../../../domain/entities/product-ingredient.entity';
import { NotFoundError } from '../../../domain/errors/domain.error';
import { IProductRepository } from '../../../domain/repositories/product.repository';
import { IProductIngredientRepository } from '../../../domain/repositories/product-ingredient.repository';

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
