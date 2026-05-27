import { Either, left, right } from '../../../domain/either';
import { ProductIngredient } from '../../../domain/entities/product-ingredient.entity';
import { NotFoundError } from '../../../domain/errors/domain.error';
import { IProductRepository } from '../../../domain/repositories/product.repository';
import { IProductIngredientRepository } from '../../../domain/repositories/product-ingredient.repository';

export class ListProductIngredientsUseCase {
  constructor(
    private readonly productRepo: IProductRepository,
    private readonly productIngredientRepo: IProductIngredientRepository,
  ) {}

  async execute(productId: string): Promise<Either<NotFoundError, ProductIngredient[]>> {
    const product = await this.productRepo.findById(productId);
    if (!product) return left(new NotFoundError(`Product ${productId}`));

    const items = await this.productIngredientRepo.findByProductId(productId);
    return right(items);
  }
}
