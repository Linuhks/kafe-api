import { beforeEach, describe, expect, it } from 'vitest';
import { Order } from '../../../domain/entities/order.entity';
import { InMemoryOrderRepository } from '../../../test/repositories/in-memory-order.repository';
import { ListOrdersUseCase } from './list-orders.use-case';

describe('ListOrdersUseCase', () => {
  let orderRepo: InMemoryOrderRepository;
  let sut: ListOrdersUseCase;

  beforeEach(() => {
    orderRepo = new InMemoryOrderRepository();
    sut = new ListOrdersUseCase(orderRepo);
  });

  it('should return paginated list with total count', async () => {
    await orderRepo.create({ totalAmount: '5.00', items: [] });
    await orderRepo.create({ totalAmount: '7.00', items: [] });
    await orderRepo.create({ totalAmount: '3.00', items: [] });

    const result = await sut.execute({ page: 1, limit: 10 });

    expect(result.data).toHaveLength(3);
    expect(result.total).toBe(3);
  });

  it('should respect page and limit for offset slicing', async () => {
    await orderRepo.create({ totalAmount: '5.00', items: [] });
    await orderRepo.create({ totalAmount: '7.00', items: [] });
    await orderRepo.create({ totalAmount: '3.00', items: [] });

    const result = await sut.execute({ page: 2, limit: 2 });

    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(3);
  });

  it('should return empty list when no orders', async () => {
    const result = await sut.execute({ page: 1, limit: 10 });

    expect(result.data).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('should order by createdAt DESC (newest first)', async () => {
    const o1 = await orderRepo.create({ totalAmount: '5.00', items: [] });
    const o2 = await orderRepo.create({ totalAmount: '7.00', items: [] });
    const o3 = await orderRepo.create({ totalAmount: '3.00', items: [] });

    // Force distinct createdAt timestamps to guarantee sort order
    const now = Date.now();
    orderRepo.items = orderRepo.items.map((o, idx) => {
      const createdAt = new Date(now + idx * 1000);
      return new Order(
        o.id,
        o.clientId,
        o.clientName,
        o.baristaId,
        o.status,
        o.notes,
        o.totalAmount,
        o.items,
        createdAt,
        createdAt,
      );
    });

    const result = await sut.execute({ page: 1, limit: 10 });

    expect(result.data[0].id).toBe(o3.id);
    expect(result.data[1].id).toBe(o2.id);
    expect(result.data[2].id).toBe(o1.id);
  });

  it('should filter by status', async () => {
    const o1 = await orderRepo.create({ totalAmount: '5.00', items: [] });
    const o2 = await orderRepo.create({ totalAmount: '7.00', items: [] });
    await orderRepo.updateStatus(o2.id, 'CANCELLED');

    const result = await sut.execute({ page: 1, limit: 10, status: 'RECEIVED' });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe(o1.id);
  });
});
