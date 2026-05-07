import { InMemoryIngredientRepository } from '@test/repositories/in-memory-ingredient.repository';
import { InMemoryInventoryMovementRepository } from '@test/repositories/in-memory-inventory-movement.repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { Ingredient } from '../../../domain/entities/ingredient.entity';
import { Order } from '../../../domain/entities/order.entity';
import { OrderItem } from '../../../domain/entities/order-item.entity';
import { InsufficientStockError } from '../../../domain/errors/domain.error';
import { DeductForOrderUseCase } from './deduct-for-order.use-case';

function makeOrder(items: OrderItem[]): Order {
  return new Order(
    'order-1',
    null,
    'Cliente',
    null,
    'RECEIVED',
    null,
    '10.00',
    items,
    new Date(),
    new Date(),
  );
}

function makeOrderItem(productId: string, quantity: number): OrderItem {
  return new OrderItem('item-1', 'order-1', productId, 'Produto', '5.00', quantity, '5.00');
}

describe('DeductForOrderUseCase', () => {
  let ingredientRepo: InMemoryIngredientRepository;
  let movementRepo: InMemoryInventoryMovementRepository;
  let sut: DeductForOrderUseCase;

  beforeEach(() => {
    ingredientRepo = new InMemoryIngredientRepository();
    movementRepo = new InMemoryInventoryMovementRepository();
    sut = new DeductForOrderUseCase(ingredientRepo, movementRepo);
  });

  it('should deduct stock for all product ingredients in order', async () => {
    const ingredient = new Ingredient('ing-1', 'Café', 'g', '1000', '100', new Date(), new Date());
    ingredientRepo.items.push(ingredient);
    ingredientRepo.recipes.push({ productId: 'prod-1', ingredientId: 'ing-1', quantity: '10' });

    const order = makeOrder([makeOrderItem('prod-1', 2)]);

    await sut.execute(order);

    const updated = ingredientRepo.items.find((i) => i.id === 'ing-1')!;
    expect(parseFloat(updated.currentStock)).toBeCloseTo(980);
  });

  it('should create DEDUCTION movements', async () => {
    const ingredient = new Ingredient('ing-1', 'Café', 'g', '1000', '100', new Date(), new Date());
    ingredientRepo.items.push(ingredient);
    ingredientRepo.recipes.push({ productId: 'prod-1', ingredientId: 'ing-1', quantity: '10' });

    const order = makeOrder([makeOrderItem('prod-1', 1)]);

    await sut.execute(order);

    expect(movementRepo.items).toHaveLength(1);
    expect(movementRepo.items[0].type).toBe('DEDUCTION');
    expect(movementRepo.items[0].ingredientId).toBe('ing-1');
    expect(movementRepo.items[0].orderId).toBe('order-1');
  });

  it('should throw InsufficientStockError when stock is insufficient', async () => {
    const ingredient = new Ingredient('ing-1', 'Café', 'g', '5', '0', new Date(), new Date());
    ingredientRepo.items.push(ingredient);
    ingredientRepo.recipes.push({ productId: 'prod-1', ingredientId: 'ing-1', quantity: '10' });

    const order = makeOrder([makeOrderItem('prod-1', 1)]);

    await expect(sut.execute(order)).rejects.toThrow(InsufficientStockError);
    expect(movementRepo.items).toHaveLength(0);
  });
});
