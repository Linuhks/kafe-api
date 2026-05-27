import { Either, left, right } from '../../../domain/either';
import { Ingredient } from '../../../domain/entities/ingredient.entity';
import { ConflictError } from '../../../domain/errors/domain.error';
import { IIngredientRepository } from '../../../domain/repositories/ingredient.repository';

export interface CreateIngredientDto {
  name: string;
  unit: string;
  currentStock?: string;
  minimumStock?: string;
}

export class CreateIngredientUseCase {
  constructor(private readonly ingredientRepo: IIngredientRepository) {}

  async execute(dto: CreateIngredientDto): Promise<Either<ConflictError, Ingredient>> {
    const existing = await this.ingredientRepo.findByName(dto.name);
    if (existing) {
      return left(new ConflictError(`Ingredient with name "${dto.name}" already exists`));
    }
    const ingredient = await this.ingredientRepo.create(dto);
    return right(ingredient);
  }
}
