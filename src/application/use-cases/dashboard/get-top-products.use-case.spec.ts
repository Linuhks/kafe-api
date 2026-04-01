import { beforeEach, describe, expect, it } from 'vitest';
import { Order, type OrderStatus } from '../../../domain/entities/order.entity.js';
import { OrderItem } from '../../../domain/entities/order-item.entity.js';
import { InMemoryOrderRepository } from '../../../test/repositories/in-memory-order.repository.js';
import { GetTopProductsUseCase } from './get-top-products.use-case.js';

function makeItem(
  orderId: string,
  productId: string,
  productName: string,
  qty: number,
  unitPrice: string,
): OrderItem {
  const subtotal = (qty * parseFloat(unitPrice)).toFixed(2);
  return new OrderItem(`item-${orderId}-${productId}`, orderId, productId, productName, unitPrice, qty, subtotal);
}

function makeOrder(
  id: string,
  status: OrderStatus,
  items: OrderItem[],
  createdAt: Date,
): Order {
  const total = items.reduce((sum, i) => sum + parseFloat(i.subtotal), 0).toFixed(2);
  return new Order(id, null, 'Cliente', null, status, null, total, items, createdAt, createdAt);
}

describe('GetTopProductsUseCase', () => {
  let orderRepo: InMemoryOrderRepository;
  let sut: GetTopProductsUseCase;

  beforeEach(() => {
    orderRepo = new InMemoryOrderRepository();
    sut = new GetTopProductsUseCase(orderRepo);

    // o1: Product A (3×5.00) + Product B (1×8.00)
    const o1Items = [
      makeItem('o1', 'prod-a', 'Product A', 3, '5.00'),
      makeItem('o1', 'prod-b', 'Product B', 1, '8.00'),
    ];
    // o2: Product A (2×5.00) + Product C (2×3.00)
    const o2Items = [
      makeItem('o2', 'prod-a', 'Product A', 2, '5.00'),
      makeItem('o2', 'prod-c', 'Product C', 2, '3.00'),
    ];
    // o3: Product B (4×8.00)
    const o3Items = [makeItem('o3', 'prod-b', 'Product B', 4, '8.00')];
    // o4 CANCELLED: Product A (10×5.00) — should be ignored
    const o4Items = [makeItem('o4', 'prod-a', 'Product A', 10, '5.00')];

    orderRepo.items.push(
      makeOrder('o1', 'DELIVERED', o1Items, new Date('2026-03-10T10:00:00')),
      makeOrder('o2', 'DELIVERED', o2Items, new Date('2026-03-15T10:00:00')),
      makeOrder('o3', 'DELIVERED', o3Items, new Date('2026-03-20T10:00:00')),
      makeOrder('o4', 'CANCELLED', o4Items, new Date('2026-03-22T10:00:00')),
    );
  });

  it('should return products ordered by quantitySold DESC', async () => {
    const result = await sut.execute();
    // Product A: qty 5, Product B: qty 5, Product C: qty 2
    // A and B tie at 5 — order determined by map insertion (prod-a first)
    expect(result[0].quantitySold).toBeGreaterThanOrEqual(result[1].quantitySold);
    expect(result[1].quantitySold).toBeGreaterThanOrEqual(result[2].quantitySold);
    expect(result[2].productId).toBe('prod-c');
    expect(result[2].quantitySold).toBe(2);
  });

  it('should exclude CANCELLED orders from calculation', async () => {
    const result = await sut.execute();
    const productA = result.find((p) => p.productId === 'prod-a');
    expect(productA?.quantitySold).toBe(5); // 3+2, not 3+2+10
    expect(productA?.revenue).toBe('25.00');
  });

  it('should sum revenue correctly per product', async () => {
    const result = await sut.execute();
    const productB = result.find((p) => p.productId === 'prod-b');
    expect(productB?.revenue).toBe('40.00'); // (1×8 + 4×8)
  });

  it('should respect the limit parameter', async () => {
    const result = await sut.execute(2);
    expect(result).toHaveLength(2);
  });

  it('should filter by date range', async () => {
    const result = await sut.execute(10, { from: '2026-03-20T00:00:00' });
    // Only o3 (prod-b ×4) is in range; o4 is CANCELLED
    expect(result).toHaveLength(1);
    expect(result[0].productId).toBe('prod-b');
    expect(result[0].quantitySold).toBe(4);
  });

  it('should return empty array when no non-cancelled orders match', async () => {
    const result = await sut.execute(10, { from: '2030-01-01T00:00:00' });
    expect(result).toHaveLength(0);
  });
});
