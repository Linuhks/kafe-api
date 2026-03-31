import { Ingredient } from '../../../domain/entities/ingredient.entity.js';
import { IIngredientRepository } from '../../../domain/repositories/ingredient.repository.js';

export class GetStockAlertsUseCase {
  constructor(private readonly ingredientRepo: IIngredientRepository) {}

  async execute(): Promise<Ingredient[]> {
    return this.ingredientRepo.findLowStock();
  }
}
