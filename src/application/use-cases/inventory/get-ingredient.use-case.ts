import type { Ingredient } from '../../../domain/entities/ingredient.entity.js';
import { NotFoundError } from '../../../domain/errors/domain.error.js';
import type { IIngredientRepository } from '../../../domain/repositories/ingredient.repository.js';

export class GetIngredientUseCase {
  constructor(private readonly ingredientRepo: IIngredientRepository) {}

  async execute(id: string): Promise<Ingredient> {
    const ingredient = await this.ingredientRepo.findById(id);
    if (!ingredient) {
      throw new NotFoundError('Ingredient');
    }
    return ingredient;
  }
}
