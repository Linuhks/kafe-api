import { ProductIngredient } from '../../domain/entities/product-ingredient.entity.js';
import {
  IProductIngredientRepository,
  CreateProductIngredientData,
} from '../../domain/repositories/product-ingredient.repository.js';

export class InMemoryProductIngredientRepository extends IProductIngredientRepository {
  items: ProductIngredient[] = [];
  private counter = 0;

  async findByProductId(productId: string): Promise<ProductIngredient[]> {
    return this.items.filter((pi) => pi.productId === productId);
  }

  async save(data: CreateProductIngredientData): Promise<ProductIngredient> {
    const pi = new ProductIngredient(
      `pi-${++this.counter}`,
      data.productId,
      data.ingredientId,
      data.quantity,
    );
    this.items.push(pi);
    return pi;
  }

  async delete(productId: string, ingredientId: string): Promise<void> {
    this.items = this.items.filter(
      (pi) => !(pi.productId === productId && pi.ingredientId === ingredientId),
    );
  }
}
