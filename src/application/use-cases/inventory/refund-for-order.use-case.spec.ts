import { InMemoryIngredientRepository } from '@test/repositories/in-memory-ingredient.repository';
import { InMemoryInventoryMovementRepository } from '@test/repositories/in-memory-inventory-movement.repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { Ingredient } from '../../../domain/entities/ingredient.entity';
import { Order } from '../../../domain/entities/order.entity';
import { RefundForOrderUseCase } from './refund-for-order.use-case';

const order = new Order(
  'order-1',
  null,
  'Cliente',
  null,
  'IN_PREPARATION',
  null,
  '10.00',
  [],
  new Date(),
  new Date(),
);

describe('RefundForOrderUseCase', () => {
  let ingredientRepo: InMemoryIngredientRepository;
  let movementRepo: InMemoryInventoryMovementRepository;
  let sut: RefundForOrderUseCase;

  beforeEach(() => {
    ingredientRepo = new InMemoryIngredientRepository();
    movementRepo = new InMemoryInventoryMovementRepository();
    sut = new RefundForOrderUseCase(ingredientRepo, movementRepo);
    ingredientRepo.items.push(
      new Ingredient('ing-1', 'Café', 'g', '70.000', '0', new Date(), new Date()),
    );
  });

  it('restocks what was deducted and records a RESTOCK movement linked to the order', async () => {
    await movementRepo.create({
      ingredientId: 'ing-1',
      orderId: 'order-1',
      type: 'DEDUCTION',
      quantity: '30.000',
    });

    const result = await sut.execute(order);

    expect(result.isRight()).toBe(true);
    expect((await ingredientRepo.findById('ing-1'))?.currentStock).toBe('100.000');
    const restocks = movementRepo.items.filter((m) => m.type === 'RESTOCK');
    expect(restocks).toHaveLength(1);
    expect(restocks[0].orderId).toBe('order-1');
    expect(restocks[0].quantity).toBe('30.000');
  });

  it('sums multiple deductions of the same ingredient and ignores other movements', async () => {
    await movementRepo.create({ ingredientId: 'ing-1', orderId: 'order-1', type: 'DEDUCTION', quantity: '10.000' });
    await movementRepo.create({ ingredientId: 'ing-1', orderId: 'order-1', type: 'DEDUCTION', quantity: '5.500' });
    await movementRepo.create({ ingredientId: 'ing-1', orderId: 'other', type: 'DEDUCTION', quantity: '99.000' });

    await sut.execute(order);

    expect((await ingredientRepo.findById('ing-1'))?.currentStock).toBe('85.500');
  });

  it('does nothing when the order has no deductions', async () => {
    await sut.execute(order);

    expect((await ingredientRepo.findById('ing-1'))?.currentStock).toBe('70.000');
    expect(movementRepo.items).toHaveLength(0);
  });
});
