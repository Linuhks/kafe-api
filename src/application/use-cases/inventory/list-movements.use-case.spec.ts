import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryInventoryMovementRepository } from '../../../test/repositories/in-memory-inventory-movement.repository.js';
import { ListMovementsUseCase } from './list-movements.use-case.js';

describe('ListMovementsUseCase', () => {
  let movementRepo: InMemoryInventoryMovementRepository;
  let sut: ListMovementsUseCase;

  beforeEach(() => {
    movementRepo = new InMemoryInventoryMovementRepository();
    sut = new ListMovementsUseCase(movementRepo);
  });

  it('should return all movements paginated', async () => {
    await movementRepo.create({ ingredientId: 'ing-1', type: 'RESTOCK', quantity: '100' });
    await movementRepo.create({ ingredientId: 'ing-2', type: 'RESTOCK', quantity: '200' });

    const result = await sut.execute({ page: 1, limit: 10 });

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should filter by ingredientId', async () => {
    await movementRepo.create({ ingredientId: 'ing-1', type: 'RESTOCK', quantity: '100' });
    await movementRepo.create({ ingredientId: 'ing-2', type: 'RESTOCK', quantity: '200' });

    const result = await sut.execute({ ingredientId: 'ing-1', page: 1, limit: 10 });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].ingredientId).toBe('ing-1');
  });

  it('should filter by orderId', async () => {
    await movementRepo.create({
      ingredientId: 'ing-1',
      orderId: 'ord-1',
      type: 'DEDUCTION',
      quantity: '50',
    });
    await movementRepo.create({
      ingredientId: 'ing-1',
      orderId: 'ord-2',
      type: 'DEDUCTION',
      quantity: '30',
    });

    const result = await sut.execute({ orderId: 'ord-1', page: 1, limit: 10 });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].orderId).toBe('ord-1');
  });

  it('should filter by date range', async () => {
    const past = new Date('2024-01-01');
    const future = new Date('2026-01-01');

    const mov1 = await movementRepo.create({
      ingredientId: 'ing-1',
      type: 'RESTOCK',
      quantity: '100',
    });
    // Override createdAt for testing purposes
    (mov1 as any).createdAt = past;
    movementRepo.items[0] = { ...mov1, createdAt: past } as any;

    const mov2 = await movementRepo.create({
      ingredientId: 'ing-2',
      type: 'RESTOCK',
      quantity: '200',
    });
    (mov2 as any).createdAt = future;
    movementRepo.items[1] = { ...mov2, createdAt: future } as any;

    const from = new Date('2025-01-01');
    const to = new Date('2027-01-01');

    const result = await sut.execute({ from, to, page: 1, limit: 10 });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].ingredientId).toBe('ing-2');
  });
});
