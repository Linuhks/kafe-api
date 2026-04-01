import { ProductIngredient } from '../entities/product-ingredient.entity.js';

export interface CreateProductIngredientData {
  productId: string;
  ingredientId: string;
  quantity: string;
}

export abstract class IProductIngredientRepository {
  abstract findByProductId(productId: string): Promise<ProductIngredient[]>;
  abstract save(data: CreateProductIngredientData): Promise<ProductIngredient>;
  abstract delete(productId: string, ingredientId: string): Promise<void>;
}
