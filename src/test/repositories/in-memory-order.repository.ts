import { Order, type OrderStatus } from '../../domain/entities/order.entity.js';
import { OrderItem } from '../../domain/entities/order-item.entity.js';
import {
  type CreateOrderData,
  type DateRange,
  IOrderRepository,
  type ListOrdersFilter,
  type OrderSummaryData,
  type PeakHourData,
  type TopProductData,
} from '../../domain/repositories/order.repository.js';

export class InMemoryOrderRepository extends IOrderRepository {
  items: Order[] = [];
  private counter = 0;

  async findById(id: string): Promise<Order | null> {
    return this.items.find((o) => o.id === id) ?? null;
  }

  async findAll(filter: ListOrdersFilter): Promise<{ data: Order[]; total: number }> {
    let filtered = this.items;
    if (filter.status) filtered = filtered.filter((o) => o.status === filter.status);
    if (filter.from) filtered = filtered.filter((o) => o.createdAt >= new Date(filter.from!));
    if (filter.to) filtered = filtered.filter((o) => o.createdAt <= new Date(filter.to!));
    filtered = [...filtered].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const start = (filter.page - 1) * filter.limit;
    return { data: filtered.slice(start, start + filter.limit), total: filtered.length };
  }

  async findByClientId(
    clientId: string,
    page: number,
    limit: number,
  ): Promise<{ data: Order[]; total: number }> {
    const filtered = this.items.filter((o) => o.clientId === clientId);
    const start = (page - 1) * limit;
    return { data: filtered.slice(start, start + limit), total: filtered.length };
  }

  async findQueue(): Promise<Order[]> {
    return this.items
      .filter((o) => o.status === 'RECEIVED' || o.status === 'IN_PREPARATION')
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async create(data: CreateOrderData): Promise<Order> {
    const id = `order-${++this.counter}`;
    const items = data.items.map(
      (item, idx) =>
        new OrderItem(
          `item-${id}-${idx}`,
          id,
          item.productId,
          item.productName,
          item.unitPrice,
          item.quantity,
          item.subtotal,
        ),
    );
    const order = new Order(
      id,
      data.clientId ?? null,
      data.clientName ?? null,
      null,
      'RECEIVED',
      data.notes ?? null,
      data.totalAmount,
      items,
      new Date(),
      new Date(),
    );
    this.items.push(order);
    return order;
  }

  async updateStatus(id: string, status: OrderStatus, baristaId?: string): Promise<Order> {
    const idx = this.items.findIndex((o) => o.id === id);
    const existing = this.items[idx];
    const updated = new Order(
      existing.id,
      existing.clientId,
      existing.clientName,
      baristaId ?? existing.baristaId,
      status,
      existing.notes,
      existing.totalAmount,
      existing.items,
      existing.createdAt,
      new Date(),
    );
    this.items[idx] = updated;
    return updated;
  }

  async getSummary(dateRange: DateRange): Promise<OrderSummaryData> {
    let filtered = this.items;
    if (dateRange.from) filtered = filtered.filter((o) => o.createdAt >= new Date(dateRange.from!));
    if (dateRange.to) filtered = filtered.filter((o) => o.createdAt <= new Date(dateRange.to!));

    const nonCancelled = filtered.filter((o) => o.status !== 'CANCELLED');
    const totalRevenueCents = nonCancelled.reduce(
      (sum, o) => sum + Math.round(parseFloat(o.totalAmount) * 100),
      0,
    );
    const avgCents = nonCancelled.length > 0 ? totalRevenueCents / nonCancelled.length : 0;

    const ordersByStatus = {
      RECEIVED: 0,
      IN_PREPARATION: 0,
      READY: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    } as Record<OrderStatus, number>;
    for (const o of filtered) ordersByStatus[o.status]++;

    return {
      totalOrders: filtered.length,
      totalRevenue: (totalRevenueCents / 100).toFixed(2),
      avgOrderValue: (avgCents / 100).toFixed(2),
      ordersByStatus,
    };
  }

  async getTopProducts(limit: number, dateRange: DateRange): Promise<TopProductData[]> {
    let filtered = this.items.filter((o) => o.status !== 'CANCELLED');
    if (dateRange.from) filtered = filtered.filter((o) => o.createdAt >= new Date(dateRange.from!));
    if (dateRange.to) filtered = filtered.filter((o) => o.createdAt <= new Date(dateRange.to!));

    const map = new Map<
      string,
      { productName: string; quantitySold: number; revenueCents: number }
    >();
    for (const order of filtered) {
      for (const item of order.items) {
        const entry = map.get(item.productId) ?? {
          productName: item.productName,
          quantitySold: 0,
          revenueCents: 0,
        };
        entry.quantitySold += item.quantity;
        entry.revenueCents += Math.round(parseFloat(item.subtotal) * 100);
        map.set(item.productId, entry);
      }
    }

    return Array.from(map.entries())
      .sort((a, b) => b[1].quantitySold - a[1].quantitySold)
      .slice(0, limit)
      .map(([productId, data]) => ({
        productId,
        productName: data.productName,
        quantitySold: data.quantitySold,
        revenue: (data.revenueCents / 100).toFixed(2),
      }));
  }

  async getPeakHours(dateRange: DateRange): Promise<PeakHourData[]> {
    let filtered = this.items;
    if (dateRange.from) filtered = filtered.filter((o) => o.createdAt >= new Date(dateRange.from!));
    if (dateRange.to) filtered = filtered.filter((o) => o.createdAt <= new Date(dateRange.to!));

    const map = new Map<number, number>();
    for (const o of filtered) {
      const hour = o.createdAt.getHours();
      map.set(hour, (map.get(hour) ?? 0) + 1);
    }

    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([hour, orderCount]) => ({ hour, orderCount }));
  }
}
