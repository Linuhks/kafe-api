import { InMemoryOrderRepository } from '@test/repositories/in-memory-order.repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetBaristaQueueUseCase } from './get-barista-queue.use-case';

describe('GetBaristaQueueUseCase', () => {
  let orderRepo: InMemoryOrderRepository;
  let sut: GetBaristaQueueUseCase;

  beforeEach(() => {
    orderRepo = new InMemoryOrderRepository();
    sut = new GetBaristaQueueUseCase(orderRepo);
  });

  it('should return only RECEIVED and IN_PREPARATION orders', async () => {
    const o1 = await orderRepo.create({ totalAmount: '5.50', items: [] });
    const o2 = await orderRepo.create({ totalAmount: '7.00', items: [] });
    await orderRepo.updateStatus(o2.id, 'IN_PREPARATION');
    const o3 = await orderRepo.create({ totalAmount: '3.00', items: [] });
    await orderRepo.updateStatus(o3.id, 'READY');

    const queue = await sut.execute();

    expect(queue).toHaveLength(2);
    expect(queue.map((o) => o.id)).toContain(o1.id);
    expect(queue.map((o) => o.id)).toContain(o2.id);
  });

  it('should order queue by createdAt ASC (oldest first)', async () => {
    const o1 = await orderRepo.create({ totalAmount: '5.50', items: [] });
    const o2 = await orderRepo.create({ totalAmount: '7.00', items: [] });

    const queue = await sut.execute();

    expect(queue[0].id).toBe(o1.id);
    expect(queue[1].id).toBe(o2.id);
  });
});
