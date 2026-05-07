import { Ingredient } from '../entities/ingredient.entity';

export interface CreateIngredientData {
  name: string;
  unit: string;
  currentStock?: string;
  minimumStock?: string;
}

export interface UpdateIngredientData {
  name?: string;
  unit?: string;
  minimumStock?: string;
}

export interface ProductIngredientRow {
  ingredientId: string;
  quantity: string;
}

export abstract class IIngredientRepository {
  abstract findById(id: string): Promise<Ingredient | null>;
  abstract findByName(name: string): Promise<Ingredient | null>;
  abstract findAll(page: number, limit: number): Promise<{ data: Ingredient[]; total: number }>;
  abstract create(data: CreateIngredientData): Promise<Ingredient>;
  abstract update(id: string, data: UpdateIngredientData): Promise<Ingredient>;
  abstract delete(id: string): Promise<void>;
  abstract deductStock(id: string, quantity: string): Promise<Ingredient>;
  abstract restockIngredient(id: string, quantity: string): Promise<Ingredient>;
  abstract findRecipeByProductId(productId: string): Promise<ProductIngredientRow[]>;
  abstract findLowStock(): Promise<Ingredient[]>;
}
