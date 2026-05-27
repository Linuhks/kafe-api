import { Either, left, right } from '../../../domain/either';
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

  async execute(id: string, dto: UpdateIngredientDto): Promise<Either<NotFoundError, Ingredient>> {
    const ingredient = await this.ingredientRepo.findById(id);
    if (!ingredient) {
      return left(new NotFoundError('Ingredient'));
    }
    const updated = await this.ingredientRepo.update(id, dto);
    return right(updated);
  }
}
