import { Ingredient } from '../../../domain/entities/ingredient.entity';
import { NotFoundError } from '../../../domain/errors/domain.error';
import { IIngredientRepository } from '../../../domain/repositories/ingredient.repository';

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
