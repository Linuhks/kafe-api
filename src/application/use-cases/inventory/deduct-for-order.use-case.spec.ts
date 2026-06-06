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

    const result = await sut.execute(order);

    expect(result.isRight()).toBe(true);
    const updated = ingredientRepo.items.find((i) => i.id === 'ing-1')!;
    expect(parseFloat(updated.currentStock)).toBeCloseTo(980);
  });

  it('should create DEDUCTION movements', async () => {
    const ingredient = new Ingredient('ing-1', 'Café', 'g', '1000', '100', new Date(), new Date());
    ingredientRepo.items.push(ingredient);
    ingredientRepo.recipes.push({ productId: 'prod-1', ingredientId: 'ing-1', quantity: '10' });

    const order = makeOrder([makeOrderItem('prod-1', 1)]);

    const result = await sut.execute(order);

    expect(result.isRight()).toBe(true);
    expect(movementRepo.items).toHaveLength(1);
    expect(movementRepo.items[0].type).toBe('DEDUCTION');
    expect(movementRepo.items[0].ingredientId).toBe('ing-1');
    expect(movementRepo.items[0].orderId).toBe('order-1');
  });

  it('should return Left(InsufficientStockError) when stock is insufficient', async () => {
    const ingredient = new Ingredient('ing-1', 'Café', 'g', '5', '0', new Date(), new Date());
    ingredientRepo.items.push(ingredient);
    ingredientRepo.recipes.push({ productId: 'prod-1', ingredientId: 'ing-1', quantity: '10' });

    const order = makeOrder([makeOrderItem('prod-1', 1)]);

    const result = await sut.execute(order);

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InsufficientStockError);
    expect(movementRepo.items).toHaveLength(0);
  });

  it('should roll back already-deducted ingredients when a later ingredient is insufficient', async () => {
    const ing1 = new Ingredient('ing-1', 'Leite', 'ml', '500', '0', new Date(), new Date());
    const ing2 = new Ingredient('ing-2', 'Café', 'g', '5', '0', new Date(), new Date());
    ingredientRepo.items.push(ing1, ing2);
    ingredientRepo.recipes.push(
      { productId: 'prod-1', ingredientId: 'ing-1', quantity: '100' },
      { productId: 'prod-1', ingredientId: 'ing-2', quantity: '10' },
    );

    const order = makeOrder([makeOrderItem('prod-1', 1)]);
    const result = await sut.execute(order);

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InsufficientStockError);
    expect(movementRepo.items).toHaveLength(0);
    const updatedIng1 = ingredientRepo.items.find((i) => i.id === 'ing-1')!;
    expect(parseFloat(updatedIng1.currentStock)).toBeCloseTo(500);
  });

  it('concurrent scenario: two calls for the same single-stock ingredient, only one succeeds', async () => {
    const ingredient = new Ingredient('ing-1', 'Café', 'g', '10', '0', new Date(), new Date());
    ingredientRepo.items.push(ingredient);
    ingredientRepo.recipes.push({ productId: 'prod-1', ingredientId: 'ing-1', quantity: '10' });

    const order1 = new Order(
      'order-1',
      null,
      'A',
      null,
      'RECEIVED',
      null,
      '5.00',
      [makeOrderItem('prod-1', 1)],
      new Date(),
      new Date(),
    );
    const order2 = new Order(
      'order-2',
      null,
      'B',
      null,
      'RECEIVED',
      null,
      '5.00',
      [new OrderItem('item-2', 'order-2', 'prod-1', 'Produto', '5.00', 1, '5.00')],
      new Date(),
      new Date(),
    );

    const [r1, r2] = await Promise.all([sut.execute(order1), sut.execute(order2)]);

    const successes = [r1, r2].filter((r) => r.isRight()).length;
    const failures = [r1, r2].filter((r) => r.isLeft()).length;

    expect(successes).toBe(1);
    expect(failures).toBe(1);

    const updated = ingredientRepo.items.find((i) => i.id === 'ing-1')!;
    expect(parseFloat(updated.currentStock)).toBeCloseTo(0);
  });
});
