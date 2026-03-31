import { Ingredient } from '../../../domain/entities/ingredient.entity.js';
import { IIngredientRepository } from '../../../domain/repositories/ingredient.repository.js';

export interface ListIngredientsResult {
  data: Ingredient[];
  total: number;
}

export class ListIngredientsUseCase {
  constructor(private readonly ingredientRepo: IIngredientRepository) {}

  async execute(page: number, limit: number): Promise<ListIngredientsResult> {
    return this.ingredientRepo.findAll(page, limit);
  }
}
