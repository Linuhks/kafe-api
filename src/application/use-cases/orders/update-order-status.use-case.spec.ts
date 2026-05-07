import { InMemoryIngredientRepository } from '@test/repositories/in-memory-ingredient.repository';
import { InMemoryInventoryMovementRepository } from '@test/repositories/in-memory-inventory-movement.repository';
import { InMemoryOrderRepository } from '@test/repositories/in-memory-order.repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeductForOrderUseCase } from '../inventory/deduct-for-order.use-case';
import { UpdateOrderStatusUseCase } from './update-order-status.use-case';

describe('UpdateOrderStatusUseCase', () => {
  let orderRepo: InMemoryOrderRepository;
  let ingredientRepo: InMemoryIngredientRepository;
  let movementRepo: InMemoryInventoryMovementRepository;
  let deductForOrder: DeductForOrderUseCase;
  let sut: UpdateOrderStatusUseCase;

  beforeEach(() => {
    orderRepo = new InMemoryOrderRepository();
    ingredientRepo = new InMemoryIngredientRepository();
    movementRepo = new InMemoryInventoryMovementRepository();
    deductForOrder = new DeductForOrderUseCase(ingredientRepo, movementRepo);
    sut = new UpdateOrderStatusUseCase(orderRepo, deductForOrder);
  });

  it('should transition order from RECEIVED to IN_PREPARATION', async () => {
    const order = await orderRepo.create({ totalAmount: '5.50', items: [] });
    const updated = await sut.execute(order.id, 'IN_PREPARATION');
    expect(updated.status).toBe('IN_PREPARATION');
  });

  it('should throw INVALID_ORDER_TRANSITION for invalid transition', async () => {
    const order = await orderRepo.create({ totalAmount: '5.50', items: [] });
    await expect(sut.execute(order.id, 'READY')).rejects.toThrow('RECEIVED');
  });

  it('should throw NOT_FOUND if order does not exist', async () => {
    await expect(sut.execute('non-existent', 'IN_PREPARATION')).rejects.toThrow('not found');
  });

  it('should deduct stock when transitioning to IN_PREPARATION', async () => {
    const ingredient = await ingredientRepo.create({
      name: 'Coffee',
      unit: 'g',
      currentStock: '100.000',
      minimumStock: '10.000',
    });
    ingredientRepo.recipes.push({
      productId: 'prod-1',
      ingredientId: ingredient.id,
      quantity: '10.000',
    });

    const order = await orderRepo.create({
      totalAmount: '5.50',
      items: [
        {
          productId: 'prod-1',
          productName: 'Espresso',
          unitPrice: '5.50',
          quantity: 2,
          subtotal: '11.00',
        },
      ],
    });

    await sut.execute(order.id, 'IN_PREPARATION');

    const updated = await ingredientRepo.findById(ingredient.id);
    expect(updated?.currentStock).toBe('80.000');
    expect(movementRepo.items).toHaveLength(1);
    expect(movementRepo.items[0].type).toBe('DEDUCTION');
  });

  it('should throw INSUFFICIENT_STOCK when stock is too low', async () => {
    const ingredient = await ingredientRepo.create({
      name: 'Coffee',
      unit: 'g',
      currentStock: '5.000',
      minimumStock: '0.000',
    });
    ingredientRepo.recipes.push({
      productId: 'prod-1',
      ingredientId: ingredient.id,
      quantity: '10.000',
    });

    const order = await orderRepo.create({
      totalAmount: '5.50',
      items: [
        {
          productId: 'prod-1',
          productName: 'Espresso',
          unitPrice: '5.50',
          quantity: 1,
          subtotal: '5.50',
        },
      ],
    });

    await expect(sut.execute(order.id, 'IN_PREPARATION')).rejects.toThrow('Insufficient stock');
  });
});
