import { Ingredient } from '../../../domain/entities/ingredient.entity';
import { IIngredientRepository } from '../../../domain/repositories/ingredient.repository';

export class GetStockAlertsUseCase {
  constructor(private readonly ingredientRepo: IIngredientRepository) {}

  async execute(): Promise<Ingredient[]> {
    return this.ingredientRepo.findLowStock();
  }
}
