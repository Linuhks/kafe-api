import { beforeEach, describe, expect, it } from 'vitest';
import { Order } from '../../../domain/entities/order.entity.js';
import { InMemoryOrderRepository } from '../../../test/repositories/in-memory-order.repository.js';
import { GetPeakHoursUseCase } from './get-peak-hours.use-case.js';

function makeOrder(id: string, createdAt: Date): Order {
  return new Order(id, null, 'Cliente', null, 'DELIVERED', null, '10.00', [], createdAt, createdAt);
}

describe('GetPeakHoursUseCase', () => {
  let orderRepo: InMemoryOrderRepository;
  let sut: GetPeakHoursUseCase;

  beforeEach(() => {
    orderRepo = new InMemoryOrderRepository();
    sut = new GetPeakHoursUseCase(orderRepo);

    orderRepo.items.push(
      makeOrder('o1', new Date('2026-03-15T08:00:00')),
      makeOrder('o2', new Date('2026-03-15T08:30:00')),
      makeOrder('o3', new Date('2026-03-15T14:00:00')),
      makeOrder('o4', new Date('2026-03-16T08:00:00')),
      makeOrder('o5', new Date('2026-03-16T22:00:00')),
    );
  });

  it('should group orders by hour correctly', async () => {
    const result = await sut.execute();
    const hour8 = result.find((h) => h.hour === 8);
    const hour14 = result.find((h) => h.hour === 14);
    const hour22 = result.find((h) => h.hour === 22);

    expect(hour8?.orderCount).toBe(3);
    expect(hour14?.orderCount).toBe(1);
    expect(hour22?.orderCount).toBe(1);
  });

  it('should order results by orderCount DESC', async () => {
    const result = await sut.execute();
    expect(result[0].hour).toBe(8);
    expect(result[0].orderCount).toBe(3);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].orderCount).toBeLessThanOrEqual(result[i - 1].orderCount);
    }
  });

  it('should filter by from date', async () => {
    const result = await sut.execute({ from: '2026-03-16T00:00:00' });
    // Only o4 (hour 8) and o5 (hour 22)
    expect(result).toHaveLength(2);
    const hour8 = result.find((h) => h.hour === 8);
    expect(hour8?.orderCount).toBe(1);
  });

  it('should filter by from and to date combined', async () => {
    const result = await sut.execute({
      from: '2026-03-15T00:00:00',
      to: '2026-03-15T23:59:59',
    });
    // Only o1 (hour 8), o2 (hour 8), o3 (hour 14)
    expect(result).toHaveLength(2);
    const hour8 = result.find((h) => h.hour === 8);
    expect(hour8?.orderCount).toBe(2);
  });

  it('should return empty array when no orders match the date range', async () => {
    const result = await sut.execute({ from: '2030-01-01T00:00:00' });
    expect(result).toHaveLength(0);
  });
});
