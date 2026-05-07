import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryOrderRepository } from '../../../test/repositories/in-memory-order.repository';
import { GetMyOrdersUseCase } from './get-my-orders.use-case';

describe('GetMyOrdersUseCase', () => {
  let orderRepo: InMemoryOrderRepository;
  let sut: GetMyOrdersUseCase;

  beforeEach(() => {
    orderRepo = new InMemoryOrderRepository();
    sut = new GetMyOrdersUseCase(orderRepo);
  });

  it('should return orders filtered by clientId', async () => {
    const o1 = await orderRepo.create({ totalAmount: '5.00', items: [], clientId: 'client-1' });
    const o2 = await orderRepo.create({ totalAmount: '7.00', items: [], clientId: 'client-1' });
    await orderRepo.create({ totalAmount: '3.00', items: [], clientId: 'client-2' });

    const result = await sut.execute('client-1', 1, 10);

    expect(result.total).toBe(2);
    expect(result.data.map((o) => o.id)).toContain(o1.id);
    expect(result.data.map((o) => o.id)).toContain(o2.id);
  });

  it('should not return orders from other clients', async () => {
    await orderRepo.create({ totalAmount: '5.00', items: [], clientId: 'client-2' });

    const result = await sut.execute('client-1', 1, 10);

    expect(result.data).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('should support pagination', async () => {
    await orderRepo.create({ totalAmount: '5.00', items: [], clientId: 'client-1' });
    await orderRepo.create({ totalAmount: '7.00', items: [], clientId: 'client-1' });
    await orderRepo.create({ totalAmount: '3.00', items: [], clientId: 'client-1' });

    const result = await sut.execute('client-1', 2, 2);

    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(3);
  });

  it('should return empty list when client has no orders', async () => {
    const result = await sut.execute('client-without-orders', 1, 10);

    expect(result.data).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
