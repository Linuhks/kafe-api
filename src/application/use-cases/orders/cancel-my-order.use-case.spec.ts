import { InMemoryIngredientRepository } from '@test/repositories/in-memory-ingredient.repository';
import { InMemoryInventoryMovementRepository } from '@test/repositories/in-memory-inventory-movement.repository';
import { InMemoryOrderRepository } from '@test/repositories/in-memory-order.repository';
import { InMemoryUnitOfWork } from '@test/repositories/in-memory-unit-of-work';
import { beforeEach, describe, expect, it } from 'vitest';
import type { OrderStatus } from '../../../domain/entities/order.entity';
import {
  InvalidOrderTransitionError,
  NotFoundError,
} from '../../../domain/errors/domain.error';
import { DeductForOrderUseCase } from '../inventory/deduct-for-order.use-case';
import { RefundForOrderUseCase } from '../inventory/refund-for-order.use-case';
import { CancelMyOrderUseCase } from './cancel-my-order.use-case';
import { UpdateOrderStatusUseCase } from './update-order-status.use-case';

describe('CancelMyOrderUseCase', () => {
  let orderRepo: InMemoryOrderRepository;
  let ingredientRepo: InMemoryIngredientRepository;
  let movementRepo: InMemoryInventoryMovementRepository;
  let sut: CancelMyOrderUseCase;

  beforeEach(() => {
    orderRepo = new InMemoryOrderRepository();
    ingredientRepo = new InMemoryIngredientRepository();
    movementRepo = new InMemoryInventoryMovementRepository();
    const updateOrderStatus = new UpdateOrderStatusUseCase(
      orderRepo,
      new DeductForOrderUseCase(ingredientRepo, movementRepo),
      new RefundForOrderUseCase(ingredientRepo, movementRepo),
      new InMemoryUnitOfWork([orderRepo, ingredientRepo, movementRepo]),
    );
    sut = new CancelMyOrderUseCase(orderRepo, updateOrderStatus);
  });

  it('should let the owner cancel a RECEIVED order without touching stock', async () => {
    const ingredient = await ingredientRepo.create({
      name: 'Coffee',
      unit: 'g',
      currentStock: '100.000',
      minimumStock: '10.000',
    });
    const order = await orderRepo.create({ clientId: 'user-1', totalAmount: '5.50', items: [] });

    const result = await sut.execute(order.id, 'user-1');

    expect(result.isRight()).toBe(true);
    expect(result.value.status).toBe('CANCELLED');
    expect((await ingredientRepo.findById(ingredient.id))?.currentStock).toBe('100.000');
    expect(movementRepo.items).toHaveLength(0);
  });

  it('should return Left(NotFoundError) if the order does not exist', async () => {
    const result = await sut.execute('non-existent', 'user-1');
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(NotFoundError);
  });

  it("should return Left(NotFoundError) for another user's order and leave it unchanged", async () => {
    const order = await orderRepo.create({ clientId: 'user-2', totalAmount: '5.50', items: [] });

    const result = await sut.execute(order.id, 'user-1');

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(NotFoundError);
    expect(orderRepo.items[0].status).toBe('RECEIVED');
  });

  it('should return Left(NotFoundError) for an anonymous order', async () => {
    const order = await orderRepo.create({ totalAmount: '5.50', items: [] });

    const result = await sut.execute(order.id, 'user-1');

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(NotFoundError);
    expect(orderRepo.items[0].status).toBe('RECEIVED');
  });

  it.each<OrderStatus>([
    'IN_PREPARATION',
    'READY',
    'DELIVERED',
    'CANCELLED',
  ])('should return Left(InvalidOrderTransitionError) when order is %s', async (status) => {
    const order = await orderRepo.create({ clientId: 'user-1', totalAmount: '5.50', items: [] });
    orderRepo.items[0].status = status;

    const result = await sut.execute(order.id, 'user-1');

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidOrderTransitionError);
    expect(orderRepo.items[0].status).toBe(status);
    expect(movementRepo.items).toHaveLength(0);
  });
});
