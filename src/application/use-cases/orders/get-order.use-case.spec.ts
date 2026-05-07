import { beforeEach, describe, expect, it } from 'vitest';
import { NotFoundError } from '../../../domain/errors/domain.error';
import { InMemoryOrderRepository } from '../../../test/repositories/in-memory-order.repository';
import { GetOrderUseCase } from './get-order.use-case';

describe('GetOrderUseCase', () => {
  let orderRepo: InMemoryOrderRepository;
  let sut: GetOrderUseCase;

  beforeEach(() => {
    orderRepo = new InMemoryOrderRepository();
    sut = new GetOrderUseCase(orderRepo);
  });

  it('should return order by ID', async () => {
    const order = await orderRepo.create({ totalAmount: '5.50', items: [] });

    const result = await sut.execute(order.id);

    expect(result.id).toBe(order.id);
    expect(result.totalAmount).toBe('5.50');
  });

  it('should throw NotFoundError for unknown ID', async () => {
    await expect(sut.execute('non-existent')).rejects.toThrow(NotFoundError);
  });
});
