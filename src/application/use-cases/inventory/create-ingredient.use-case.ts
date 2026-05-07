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

  async execute(dto: CreateIngredientDto): Promise<Ingredient> {
    const existing = await this.ingredientRepo.findByName(dto.name);
    if (existing) {
      throw new ConflictError(`Ingredient with name "${dto.name}" already exists`);
    }
    return this.ingredientRepo.create(dto);
  }
}
