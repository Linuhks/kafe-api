import { Ingredient } from '../../../domain/entities/ingredient.entity';
import { NotFoundError } from '../../../domain/errors/domain.error';
import { IIngredientRepository } from '../../../domain/repositories/ingredient.repository';

export interface UpdateIngredientDto {
  name?: string;
  unit?: string;
  minimumStock?: string;
}

export class UpdateIngredientUseCase {
  constructor(private readonly ingredientRepo: IIngredientRepository) {}

  async execute(id: string, dto: UpdateIngredientDto): Promise<Ingredient> {
    const ingredient = await this.ingredientRepo.findById(id);
    if (!ingredient) {
      throw new NotFoundError('Ingredient');
    }
    return this.ingredientRepo.update(id, dto);
  }
}
