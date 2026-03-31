import { Order } from '../../../domain/entities/order.entity.js';
import { InsufficientStockError } from '../../../domain/errors/domain.error.js';
import { IIngredientRepository } from '../../../domain/repositories/ingredient.repository.js';
import { IInventoryMovementRepository } from '../../../domain/repositories/inventory-movement.repository.js';

export class DeductForOrderUseCase {
  constructor(
    private readonly ingredientRepo: IIngredientRepository,
    private readonly movementRepo: IInventoryMovementRepository,
  ) {}

  async execute(order: Order): Promise<void> {
    const neededMillis = new Map<string, number>();

    for (const item of order.items) {
      const recipe = await this.ingredientRepo.findRecipeByProductId(item.productId);
      for (const recipeItem of recipe) {
        const qty = Math.round(parseFloat(recipeItem.quantity) * item.quantity * 1000);
        neededMillis.set(recipeItem.ingredientId, (neededMillis.get(recipeItem.ingredientId) ?? 0) + qty);
      }
    }

    for (const [ingredientId, qtyMillis] of neededMillis) {
      const ingredient = await this.ingredientRepo.findById(ingredientId);
      if (!ingredient) continue;
      const currentMillis = Math.round(parseFloat(ingredient.currentStock) * 1000);
      if (currentMillis < qtyMillis) {
        throw new InsufficientStockError(ingredient.name);
      }
    }

    for (const [ingredientId, qtyMillis] of neededMillis) {
      const quantity = (qtyMillis / 1000).toFixed(3);
      await this.ingredientRepo.deductStock(ingredientId, quantity);
      await this.movementRepo.create({
        ingredientId,
        orderId: order.id,
        type: 'DEDUCTION',
        quantity,
        note: `Order ${order.id}`,
      });
    }
  }
}
