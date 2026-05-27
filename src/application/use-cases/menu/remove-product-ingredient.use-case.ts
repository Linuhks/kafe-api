import { Either, left, right } from '../../../domain/either';
import { NotFoundError } from '../../../domain/errors/domain.error';
import { IProductRepository } from '../../../domain/repositories/product.repository';
import { IProductIngredientRepository } from '../../../domain/repositories/product-ingredient.repository';

export class RemoveProductIngredientUseCase {
  constructor(
    private readonly productRepo: IProductRepository,
    private readonly productIngredientRepo: IProductIngredientRepository,
  ) {}

  async execute(productId: string, ingredientId: string): Promise<Either<NotFoundError, void>> {
    const product = await this.productRepo.findById(productId);
    if (!product) return left(new NotFoundError(`Product ${productId}`));

    await this.productIngredientRepo.delete(productId, ingredientId);
    return right(undefined);
  }
}
