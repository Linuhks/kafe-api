import { ProductIngredient } from '../../../domain/entities/product-ingredient.entity';
import { NotFoundError } from '../../../domain/errors/domain.error';
import { IIngredientRepository } from '../../../domain/repositories/ingredient.repository';
import { IProductRepository } from '../../../domain/repositories/product.repository';
import { IProductIngredientRepository } from '../../../domain/repositories/product-ingredient.repository';

interface AddProductIngredientInput {
  productId: string;
  ingredientId: string;
  quantity: string;
}

export class AddProductIngredientUseCase {
  constructor(
    private readonly productRepo: IProductRepository,
    private readonly ingredientRepo: IIngredientRepository,
    private readonly productIngredientRepo: IProductIngredientRepository,
  ) {}

  async execute(data: AddProductIngredientInput): Promise<ProductIngredient> {
    const product = await this.productRepo.findById(data.productId);
    if (!product) throw new NotFoundError(`Product ${data.productId}`);

    const ingredient = await this.ingredientRepo.findById(data.ingredientId);
    if (!ingredient) throw new NotFoundError(`Ingredient ${data.ingredientId}`);

    return this.productIngredientRepo.save({
      productId: data.productId,
      ingredientId: data.ingredientId,
      quantity: data.quantity,
    });
  }
}
