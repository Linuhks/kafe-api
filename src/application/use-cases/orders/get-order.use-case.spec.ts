import { InMemoryOrderRepository } from '@test/repositories/in-memory-order.repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { NotFoundError } from '../../../domain/errors/domain.error';
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

    expect(result.isRight()).toBe(true);
    expect(result.value.id).toBe(order.id);
    expect(result.value.totalAmount).toBe('5.50');
  });

  it('should return Left(NotFoundError) for unknown ID', async () => {
    const result = await sut.execute('non-existent');

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(NotFoundError);
  });
});
