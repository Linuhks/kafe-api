import { InMemoryIngredientRepository } from '@test/repositories/in-memory-ingredient.repository';
import { InMemoryInventoryMovementRepository } from '@test/repositories/in-memory-inventory-movement.repository';
import { InMemoryOrderRepository } from '@test/repositories/in-memory-order.repository';
import { InMemoryUnitOfWork } from '@test/repositories/in-memory-unit-of-work';
import { beforeEach, describe, expect, it } from 'vitest';
import { ConflictError } from '../../../domain/errors/domain.error';
import { DeductForOrderUseCase } from '../inventory/deduct-for-order.use-case';
import { RefundForOrderUseCase } from '../inventory/refund-for-order.use-case';
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
    sut = new UpdateOrderStatusUseCase(
      orderRepo,
      deductForOrder,
      new RefundForOrderUseCase(ingredientRepo, movementRepo),
      new InMemoryUnitOfWork([orderRepo, ingredientRepo, movementRepo]),
    );
  });

  it('should transition order from RECEIVED to IN_PREPARATION', async () => {
    const order = await orderRepo.create({ totalAmount: '5.50', items: [] });
    const result = await sut.execute(order.id, 'IN_PREPARATION');
    expect(result.isRight()).toBe(true);
    expect(result.value.status).toBe('IN_PREPARATION');
  });

  it('should return Left(InvalidOrderTransitionError) for invalid transition', async () => {
    const order = await orderRepo.create({ totalAmount: '5.50', items: [] });
    const result = await sut.execute(order.id, 'READY');
    expect(result.isLeft()).toBe(true);
    expect(result.value.message).toContain('RECEIVED');
  });

  it('should return Left(NotFoundError) if order does not exist', async () => {
    const result = await sut.execute('non-existent', 'IN_PREPARATION');
    expect(result.isLeft()).toBe(true);
    expect(result.value.message).toContain('not found');
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

    const result = await sut.execute(order.id, 'IN_PREPARATION');
    expect(result.isRight()).toBe(true);

    const updated = await ingredientRepo.findById(ingredient.id);
    expect(updated?.currentStock).toBe('80.000');
    expect(movementRepo.items).toHaveLength(1);
    expect(movementRepo.items[0].type).toBe('DEDUCTION');
  });

  it('should return Left(InsufficientStockError) when stock is too low', async () => {
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

    const result = await sut.execute(order.id, 'IN_PREPARATION');
    expect(result.isLeft()).toBe(true);
    expect(result.value.message).toContain('Insufficient stock');
  });

  describe('stock consistency', () => {
    async function seedOrderWithRecipe() {
      const ingredient = await ingredientRepo.create({
        name: 'Coffee',
        unit: 'g',
        currentStock: '100.000',
        minimumStock: '0.000',
      });
      ingredientRepo.recipes.push({
        productId: 'prod-1',
        ingredientId: ingredient.id,
        quantity: '10.000',
      });
      const order = await orderRepo.create({
        totalAmount: '11.00',
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
      return { ingredient, order };
    }

    it('should refund stock and record RESTOCK when cancelling an IN_PREPARATION order', async () => {
      const { ingredient, order } = await seedOrderWithRecipe();
      await sut.execute(order.id, 'IN_PREPARATION');

      const result = await sut.execute(order.id, 'CANCELLED');

      expect(result.isRight()).toBe(true);
      expect(result.value.status).toBe('CANCELLED');
      expect((await ingredientRepo.findById(ingredient.id))?.currentStock).toBe('100.000');
      const restocks = movementRepo.items.filter((m) => m.type === 'RESTOCK');
      expect(restocks).toHaveLength(1);
      expect(restocks[0].orderId).toBe(order.id);
      expect(restocks[0].quantity).toBe('20.000');
    });

    it('should not touch stock when cancelling a RECEIVED order', async () => {
      const { ingredient, order } = await seedOrderWithRecipe();

      const result = await sut.execute(order.id, 'CANCELLED');

      expect(result.isRight()).toBe(true);
      expect((await ingredientRepo.findById(ingredient.id))?.currentStock).toBe('100.000');
      expect(movementRepo.items).toHaveLength(0);
    });

    it('should not refund twice when a cancelled order is cancelled again', async () => {
      const { ingredient, order } = await seedOrderWithRecipe();
      await sut.execute(order.id, 'IN_PREPARATION');
      await sut.execute(order.id, 'CANCELLED');

      const again = await sut.execute(order.id, 'CANCELLED');

      expect(again.isLeft()).toBe(true);
      expect((await ingredientRepo.findById(ingredient.id))?.currentStock).toBe('100.000');
      expect(movementRepo.items.filter((m) => m.type === 'RESTOCK')).toHaveLength(1);
    });

    it('should return Left(ConflictError) and leave stock untouched when the status changed concurrently', async () => {
      const { ingredient, order } = await seedOrderWithRecipe();
      const realTransition = orderRepo.transitionStatus.bind(orderRepo);
      orderRepo.transitionStatus = async (id, from, to, baristaId) => {
        await orderRepo.updateStatus(id, 'IN_PREPARATION'); // another request wins the race
        return realTransition(id, from, to, baristaId);
      };

      const result = await sut.execute(order.id, 'IN_PREPARATION');

      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(ConflictError);
      expect((await ingredientRepo.findById(ingredient.id))?.currentStock).toBe('100.000');
      expect(movementRepo.items).toHaveLength(0);
    });

    it('should leave the order RECEIVED and stock untouched when stock is insufficient', async () => {
      const { ingredient, order } = await seedOrderWithRecipe();
      await ingredientRepo.deductStockIfSufficient(ingredient.id, '90.000');

      const result = await sut.execute(order.id, 'IN_PREPARATION');

      expect(result.isLeft()).toBe(true);
      expect((await orderRepo.findById(order.id))?.status).toBe('RECEIVED');
      expect((await ingredientRepo.findById(ingredient.id))?.currentStock).toBe('10.000');
    });

    it('should roll everything back when writing a movement fails', async () => {
      const { ingredient, order } = await seedOrderWithRecipe();
      movementRepo.create = async () => {
        throw new Error('db down');
      };

      await expect(sut.execute(order.id, 'IN_PREPARATION')).rejects.toThrow('db down');

      expect((await orderRepo.findById(order.id))?.status).toBe('RECEIVED');
      expect((await ingredientRepo.findById(ingredient.id))?.currentStock).toBe('100.000');
    });
  });
});
