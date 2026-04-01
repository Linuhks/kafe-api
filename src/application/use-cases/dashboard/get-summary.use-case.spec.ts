import { beforeEach, describe, expect, it } from 'vitest';
import { Order, type OrderStatus } from '../../../domain/entities/order.entity.js';
import { InMemoryOrderRepository } from '../../../test/repositories/in-memory-order.repository.js';
import { GetSummaryUseCase } from './get-summary.use-case.js';

function makeOrder(id: string, status: OrderStatus, totalAmount: string, createdAt: Date): Order {
  return new Order(id, null, 'Cliente', null, status, null, totalAmount, [], createdAt, createdAt);
}

describe('GetSummaryUseCase', () => {
  let orderRepo: InMemoryOrderRepository;
  let sut: GetSummaryUseCase;

  beforeEach(() => {
    orderRepo = new InMemoryOrderRepository();
    sut = new GetSummaryUseCase(orderRepo);

    orderRepo.items.push(
      makeOrder('order-1', 'DELIVERED', '10.00', new Date('2026-03-10T10:00:00')),
      makeOrder('order-2', 'DELIVERED', '20.00', new Date('2026-03-15T10:00:00')),
      makeOrder('order-3', 'IN_PREPARATION', '15.00', new Date('2026-03-20T10:00:00')),
      makeOrder('order-4', 'RECEIVED', '5.00', new Date('2026-03-20T12:00:00')),
      makeOrder('order-5', 'CANCELLED', '30.00', new Date('2026-03-25T10:00:00')),
      makeOrder('order-6', 'DELIVERED', '12.00', new Date('2026-03-28T10:00:00')),
    );
  });

  it('should count all orders including CANCELLED', async () => {
    const result = await sut.execute();
    expect(result.totalOrders).toBe(6);
  });

  it('should calculate totalRevenue excluding CANCELLED orders', async () => {
    const result = await sut.execute();
    expect(result.totalRevenue).toBe('62.00');
  });

  it('should calculate avgOrderValue from non-cancelled orders', async () => {
    const result = await sut.execute();
    expect(result.avgOrderValue).toBe('12.40');
  });

  it('should group orders by status correctly', async () => {
    const result = await sut.execute();
    expect(result.ordersByStatus).toMatchObject({
      DELIVERED: 3,
      IN_PREPARATION: 1,
      RECEIVED: 1,
      CANCELLED: 1,
      READY: 0,
    });
  });

  it('should filter by from date', async () => {
    const result = await sut.execute({ from: '2026-03-20T00:00:00' });
    expect(result.totalOrders).toBe(4);
    expect(result.totalRevenue).toBe('32.00');
  });

  it('should filter by to date', async () => {
    const result = await sut.execute({ to: '2026-03-15T23:59:59' });
    expect(result.totalOrders).toBe(2);
    expect(result.totalRevenue).toBe('30.00');
  });

  it('should filter by from and to date combined', async () => {
    const result = await sut.execute({ from: '2026-03-15T00:00:00', to: '2026-03-20T23:59:59' });
    expect(result.totalOrders).toBe(3);
  });

  it('should return zeros when no orders match the date range', async () => {
    const result = await sut.execute({ from: '2030-01-01T00:00:00' });
    expect(result.totalOrders).toBe(0);
    expect(result.totalRevenue).toBe('0.00');
    expect(result.avgOrderValue).toBe('0.00');
  });
});
