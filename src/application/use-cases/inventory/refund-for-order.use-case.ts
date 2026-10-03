import { Either, right } from '../../../domain/either';
import { Order } from '../../../domain/entities/order.entity';
import { IIngredientRepository } from '../../../domain/repositories/ingredient.repository';
import { IInventoryMovementRepository } from '../../../domain/repositories/inventory-movement.repository';

export class RefundForOrderUseCase {
  constructor(
    private readonly ingredientRepo: IIngredientRepository,
    private readonly movementRepo: IInventoryMovementRepository,
  ) {}

  /** Gives back to each ingredient exactly what was deducted for the order. */
  async execute(order: Order): Promise<Either<never, void>> {
    const movements = await this.movementRepo.findByOrderId(order.id);

    const deductedMillis = new Map<string, number>();
    for (const movement of movements) {
      if (movement.type !== 'DEDUCTION') continue;
      const qty = Math.round(parseFloat(movement.quantity) * 1000);
      deductedMillis.set(
        movement.ingredientId,
        (deductedMillis.get(movement.ingredientId) ?? 0) + qty,
      );
    }

    for (const [ingredientId, qtyMillis] of deductedMillis) {
      const quantity = (qtyMillis / 1000).toFixed(3);
      await this.ingredientRepo.restockIngredient(ingredientId, quantity);
      await this.movementRepo.create({
        ingredientId,
        orderId: order.id,
        type: 'RESTOCK',
        quantity,
        note: `Order ${order.id} cancelled`,
      });
    }

    return right(undefined);
  }
}
