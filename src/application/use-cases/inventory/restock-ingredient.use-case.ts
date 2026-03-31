import { NotFoundError } from '../../../domain/errors/domain.error.js';
import { Ingredient } from '../../../domain/entities/ingredient.entity.js';
import { IIngredientRepository } from '../../../domain/repositories/ingredient.repository.js';
import { IInventoryMovementRepository } from '../../../domain/repositories/inventory-movement.repository.js';

export class RestockIngredientUseCase {
  constructor(
    private readonly ingredientRepo: IIngredientRepository,
    private readonly movementRepo: IInventoryMovementRepository,
  ) {}

  async execute(id: string, quantity: string, note?: string): Promise<Ingredient> {
    const ingredient = await this.ingredientRepo.findById(id);
    if (!ingredient) {
      throw new NotFoundError('Ingredient');
    }
    const updated = await this.ingredientRepo.restockIngredient(id, quantity);
    await this.movementRepo.create({
      ingredientId: id,
      type: 'RESTOCK',
      quantity,
      note: note ?? null,
    });
    return updated;
  }
}
