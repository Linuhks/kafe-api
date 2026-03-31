import { Order, OrderStatus } from '../../domain/entities/order.entity.js';
import { OrderItem } from '../../domain/entities/order-item.entity.js';
import {
  IOrderRepository,
  CreateOrderData,
  ListOrdersFilter,
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
}
